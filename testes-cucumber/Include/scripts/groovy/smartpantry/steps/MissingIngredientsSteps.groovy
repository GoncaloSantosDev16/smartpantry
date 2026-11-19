package smartpantry.steps

import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import groovy.json.JsonOutput
import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-127 — Step definitions da US-12 (SCRUM-40): enviar os ingredientes em
 * falta de uma receita para a lista de compras, e o "+" que os manda para a
 * despensa (SCRUM-128).
 *
 * Reutiliza passos que já existem:
 *   OnboardingSteps        -> "I have completed the onboarding"
 *   RecipeSuggestionsSteps -> "the pantry has the following items:",
 *                             "I open the recipe search from the header",
 *                             "I search for recipes",
 *                             "the recipe ... has N of M ingredients in the pantry"
 *   ShoppingListSteps      -> "the header counter shows N", "the header counter is hidden",
 *                             "I open the shopping list from the header",
 *                             "I see / I do not see ... in the shopping list",
 *                             "the shopping list has the item ..."
 *
 * O browser é aberto e fechado pelo Hooks.groovy.
 */
public class MissingIngredientsSteps {

    // ------------------------------------------------------------- helpers

    private static String cartao(String titulo) {
        return "[data-testid='recipe-card'][data-title='" + titulo + "']"
    }

    private static TestObject botaoAdicionar(String titulo) {
        return Suporte.porCss(cartao(titulo) + " [data-testid='recipe-add-missing']")
    }

    private static TestObject ingrediente(String nome, String titulo) {
        return Suporte.porCss(cartao(titulo) + " [data-testid='recipe-ingredient'][data-name='" + nome + "']")
    }

    /** Esvazia a tabela shoppingItems (mesma técnica do Suporte.limparPerfis). */
    private static void limparListaCompras() {
        WebUI.executeJavaScript('''
            window.__listaVazia = false
            var pedido = indexedDB.open('smartpantry')
            pedido.onsuccess = function (evento) {
                var bd = evento.target.result
                if (!bd.objectStoreNames.contains('shoppingItems')) {
                    bd.close(); window.__listaVazia = true; return
                }
                var transacao = bd.transaction('shoppingItems', 'readwrite')
                transacao.objectStore('shoppingItems').clear()
                transacao.oncomplete = function () { bd.close(); window.__listaVazia = true }
                transacao.onerror = function () { bd.close(); window.__listaVazia = true }
            }
            pedido.onerror = function () { window.__listaVazia = true }
        ''', null)

        for (int tentativa = 0; tentativa < 10; tentativa++) {
            if (WebUI.executeJavaScript('return window.__listaVazia === true', null)) {
                return
            }
            WebUI.delay(1)
        }
        KeywordUtil.markFailedAndStop('Não foi possível esvaziar a lista de compras no IndexedDB.')
    }

    // ---------------------------------------------------------------- Given

    @Given("^I start with an empty shopping list\$")
    public void listaComprasVazia() {
        limparListaCompras()
    }

    /**
     * Simula o Spoonacular com uma receita. Usa-se depois de abrir a página de
     * receitas: a navegação é dentro da SPA, por isso o mock fica no window.
     * Ingredientes em inglês, separados por vírgulas (ex.: "rice, onion, garlic").
     */
    @Given("^the recipe API returns the recipe \"([^\"]*)\" with the ingredients \"([^\"]*)\"\$")
    public void apiDevolveReceita(String titulo, String ingredientes) {
        List<Map> lista = ingredientes.split(',').collect { nome ->
            [nameClean: nome.trim(), amount: 1, unit: '']
        }
        Map mock = [
            data: [
                results: [
                    [
                        id                  : 201,
                        title               : titulo,
                        readyInMinutes      : 20,
                        servings            : 2,
                        extendedIngredients : lista,
                        analyzedInstructions: [[steps: [[number: 1, step: 'Cook everything together.']]]],
                    ],
                ],
            ],
        ]
        WebUI.executeJavaScript('window.__SMARTPANTRY_SPOONACULAR_MOCK__ = JSON.parse(arguments[0])', [JsonOutput.toJson(mock)])
    }

    // ----------------------------------------------------------------- When

    @When("^I add the missing ingredients of \"([^\"]*)\" to the shopping list\$")
    public void adicionarEmFalta(String titulo) {
        WebUI.waitForElementClickable(botaoAdicionar(titulo), Suporte.ESPERA)
        WebUI.click(botaoAdicionar(titulo))
        // O botão dá lugar a "✓ Na lista de compras" quando a store acaba de gravar.
        WebUI.waitForElementPresent(
            Suporte.porCss(cartao(titulo) + " [data-testid='recipe-missing-on-list']"), Suporte.ESPERA)
    }

    @When("^I add the ingredient \"([^\"]*)\" of \"([^\"]*)\" to the pantry\$")
    public void adicionarADespensa(String nome, String titulo) {
        TestObject mais = Suporte.porCss(
            cartao(titulo) + " [data-testid='recipe-ingredient'][data-name='" + nome + "'] [data-testid='recipe-ingredient-to-pantry']")
        WebUI.waitForElementClickable(mais, Suporte.ESPERA)
        WebUI.click(mais)
    }

    // ----------------------------------------------------------------- Then

    @Then("^the recipe \"([^\"]*)\" offers to add (\\d+) ingredients? to the shopping list\$")
    public void ofereceAdicionar(String titulo, int quantos) {
        WebUI.verifyElementAttributeValue(botaoAdicionar(titulo), 'data-count', String.valueOf(quantos), Suporte.ESPERA)
        String texto = WebUI.getText(botaoAdicionar(titulo))
        if (!texto.contains('Adicionar ' + quantos)) {
            KeywordUtil.markFailed("O botão diz '" + texto + "' e devia oferecer " + quantos + " ingrediente(s).")
        }
    }

    @Then("^the recipe \"([^\"]*)\" shows its missing ingredients are on the shopping list\$")
    public void mostraNaLista(String titulo) {
        WebUI.verifyElementVisible(Suporte.porCss(cartao(titulo) + " [data-testid='recipe-missing-on-list']"))
        WebUI.verifyElementNotPresent(botaoAdicionar(titulo), 1)
    }

    @Then("^the recipe \"([^\"]*)\" does not offer to add ingredients to the shopping list\$")
    public void naoOfereceAdicionar(String titulo) {
        WebUI.verifyElementPresent(Suporte.porCss(cartao(titulo)), Suporte.ESPERA)
        WebUI.verifyElementNotPresent(botaoAdicionar(titulo), 1)
        WebUI.verifyElementNotPresent(Suporte.porCss(cartao(titulo) + " [data-testid='recipe-missing-on-list']"), 1)
    }

    @Then("^the ingredient \"([^\"]*)\" of \"([^\"]*)\" is shown as in the pantry\$")
    public void ingredienteNaDespensa(String nome, String titulo) {
        WebUI.verifyElementAttributeValue(ingrediente(nome, titulo), 'data-in-pantry', 'true', Suporte.ESPERA)
    }

    @Then("^the pantry on the recipes page includes \"([^\"]*)\"\$")
    public void despensaInclui(String nome) {
        for (int tentativa = 0; tentativa < Suporte.ESPERA; tentativa++) {
            String textos = String.valueOf(WebUI.executeJavaScript('''
                var itens = document.querySelectorAll("[data-testid='pantry-ingredient']")
                return Array.prototype.map.call(itens, function (i) { return i.textContent.trim() }).join('|')
            ''', null))
            if (textos.split('\\|').any { it.startsWith(nome) }) {
                return
            }
            WebUI.delay(1)
        }
        KeywordUtil.markFailed("A despensa da página de receitas não mostra '" + nome + "'.")
    }
}