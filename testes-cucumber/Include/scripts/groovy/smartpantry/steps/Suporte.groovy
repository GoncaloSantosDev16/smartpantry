package smartpantry.steps

import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

/**
 * SCRUM-69 — Funções de apoio partilhadas pelas step definitions.
 *
 * Evita o Object Repository: os elementos são localizados pelos atributos
 * data-testid que já existem nos componentes Vue.
 */
public class Suporte {

    /**
     * Endereço do servidor de desenvolvimento.
     *
     * CONFIRMA ISTO: corre `npm run dev` e usa exatamente o endereço que o
     * terminal imprime. O basic-ssl foi retirado do vite.config.js, por isso é http.
     */
    public static final String BASE_URL = 'http://localhost:5173'

    public static final int ESPERA = 10

    /** Constrói um TestObject a partir de um data-testid. */
    public static TestObject porTestId(String testId) {
        TestObject objeto = new TestObject(testId)
        objeto.addProperty('css', ConditionType.EQUALS, "[data-testid='" + testId + "']")
        return objeto
    }

    /** Constrói um TestObject a partir de um seletor CSS livre. */
    public static TestObject porCss(String css) {
        TestObject objeto = new TestObject(css)
        objeto.addProperty('css', ConditionType.EQUALS, css)
        return objeto
    }

    /**
     * Esvazia a tabela de perfis no IndexedDB.
     *
     * Não se apaga a base inteira de propósito: a aplicação mantém uma ligação
     * aberta pelo Dexie e o deleteDatabase ficaria bloqueado. Abrir uma segunda
     * ligação e limpar a object store funciona sem conflito.
     *
     * O IndexedDB é assíncrono e o executeJavaScript do Katalon não espera por
     * promessas, por isso marca-se uma flag no window e sonda-se até concluir.
     */
    public static void limparPerfis() {
        WebUI.executeJavaScript('''
            window.__limpezaConcluida = false
            var pedido = indexedDB.open('smartpantry')
            pedido.onsuccess = function (evento) {
                var bd = evento.target.result
                if (!bd.objectStoreNames.contains('profiles')) {
                    bd.close()
                    window.__limpezaConcluida = true
                    return
                }
                var transacao = bd.transaction('profiles', 'readwrite')
                transacao.objectStore('profiles').clear()
                transacao.oncomplete = function () {
                    bd.close()
                    window.__limpezaConcluida = true
                }
                transacao.onerror = function () {
                    bd.close()
                    window.__limpezaConcluida = true
                }
            }
            pedido.onerror = function () { window.__limpezaConcluida = true }
        ''', null)

        for (int tentativa = 0; tentativa < 10; tentativa++) {
            if (WebUI.executeJavaScript('return window.__limpezaConcluida === true', null)) {
                return
            }
            WebUI.delay(1)
        }
    }

    /**
     * Escreve num campo e avisa o Vue.
     *
     * O v-model só reage ao evento 'input'. Limpar o campo pelo WebDriver nem
     * sempre o dispara, e o Vue ficaria com o valor antigo em memória.
     */
    public static void escreverCampo(String testId, String valor) {
        WebUI.executeJavaScript('''
            var campo = document.querySelector("[data-testid='" + arguments[0] + "']")
            if (!campo) { return false }
            var proto = Object.getPrototypeOf(campo)
            var setter = Object.getOwnPropertyDescriptor(proto, 'value').set
            setter.call(campo, arguments[1])
            campo.dispatchEvent(new Event('input', { bubbles: true }))
            return true
        ''', [testId, valor])
    }

    /** Percorre o onboarding com os valores por omissão e conclui-o. */
    public static void completarOnboarding() {
        WebUI.navigateToUrl(BASE_URL + '/onboarding')
        WebUI.waitForElementPresent(porTestId('onboarding'), ESPERA)

        WebUI.click(porTestId('onboarding-next'))
        WebUI.click(porTestId('onboarding-next'))
        WebUI.click(porTestId('onboarding-finish'))

        WebUI.waitForElementNotPresent(porTestId('onboarding'), ESPERA)
    }

    /** Número de etiquetas apresentadas num TagInput. */
    public static int contarEtiquetas(String testid) {
        Object total = WebUI.executeJavaScript('''
            var campo = document.querySelector("[data-testid='" + arguments[0] + "-input']")
            if (!campo) { return -1 }
            var bloco = campo.closest('div').parentElement
            return bloco.querySelectorAll('li').length
        ''', [testid])
        return ((Number) total).intValue()
    }

    /** Texto de todas as etiquetas de um TagInput, em minúsculas. */
    public static String textoEtiquetas(String testid) {
        Object texto = WebUI.executeJavaScript('''
            var campo = document.querySelector("[data-testid='" + arguments[0] + "-input']")
            if (!campo) { return '' }
            var bloco = campo.closest('div').parentElement
            var itens = bloco.querySelectorAll('li')
            return Array.prototype.map.call(itens, function (item) {
                return item.textContent.trim()
            }).join('|').toLowerCase()
        ''', [testid])
        return String.valueOf(texto)
    }
}