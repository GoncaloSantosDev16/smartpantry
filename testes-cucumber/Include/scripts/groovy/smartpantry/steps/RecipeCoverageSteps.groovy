package smartpantry.steps

import java.time.LocalDate

import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import groovy.json.JsonOutput
import io.cucumber.datatable.DataTable
import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-113/114/115 — Step definitions da US-10 (% de ingredientes na despensa).
 *
 * Contrato com a UI (RecipeCard.vue):
 *   [data-testid='recipe-card'][data-title='…']                    cartão
 *   [data-testid='recipe-ingredient'][data-name='…'][data-in-pantry='true|false']
 *   [data-testid='recipe-coverage-text']   texto "Tem N% dos ingredientes"
 *   [data-testid='recipe-coverage-bar']    role="progressbar" aria-valuenow="N"
 *
 * O Spoonacular é simulado com window.__SMARTPANTRY_SPOONACULAR_MOCK__ (recipesApi.js).
 * O browser é aberto e fechado pelo Hooks.groovy.
 */
public class RecipeCoverageSteps {

    private Map mockPendente = null

    // ------------------------------------------------------------- helpers

    private static TestObject cartao(String titulo) {
        return Suporte.porCss("[data-testid='recipe-card'][data-title='" + titulo + "']")
    }

    private static TestObject dentroDoCartao(String titulo, String css) {
        return Suporte.porCss("[data-testid='recipe-card'][data-title='" + titulo + "'] " + css)
    }

    private static void definirDespensa(List<Map> itens) {
        WebUI.executeJavaScript('''
            window.__despensaPronta = false
            var itens = JSON.parse(arguments[0])
            var pedido = indexedDB.open('smartpantry')
            pedido.onsuccess = function (evento) {
                var bd = evento.target.result
                var transacao = bd.transaction('pantryItems', 'readwrite')
                var tabela = transacao.objectStore('pantryItems')
                tabela.clear()
                itens.forEach(function (item) { tabela.add(item) })
                transacao.oncomplete = function () { bd.close(); window.__despensaPronta = true }
                transacao.onerror = function () { bd.close(); window.__despensaPronta = true }
            }
            pedido.onerror = function () { window.__despensaPronta = true }
        ''', [JsonOutput.toJson(itens)])

        for (int tentativa = 0; tentativa < 10; tentativa++) {
            if (WebUI.executeJavaScript('return window.__despensaPronta === true', null)) {
                return
            }
            WebUI.delay(1)
        }
        KeywordUtil.markFailedAndStop('Não foi possível preparar a despensa no IndexedDB.')
    }

    // ---------------------------------------------------------------- Given

    @Given("^the pantry contains:\$")
    public void despensaContem(DataTable tabela) {
        List<Map> itens = tabela.asMaps(String, String).collect { linha ->
            Map item = [
                name    : linha.name,
                quantity: Double.parseDouble(linha.quantity),
                unit    : linha.unit,
                category: 'Outro',
            ]
            String dias = (linha.expires ?: '').trim()
            item.expirationDate = dias ? LocalDate.now().plusDays(Integer.parseInt(dias)).toString() : null
            return item
        }
        definirDespensa(itens)
    }

    @Given("^the recipe catalogue contains:\$")
    public void catalogoContem(DataTable tabela) {
        int id = 1000
        List<Map> receitas = tabela.asMaps(String, String).collect { linha ->
            id++
            [
                id                  : id,
                title               : linha.title,
                readyInMinutes      : 20,
                servings            : 2,
                extendedIngredients : linha.ingredients.split(',').collect { [nameClean: it.trim(), amount: 1, unit: ''] },
                analyzedInstructions: [[steps: [[number: 1, step: 'Cook.']]]],
            ]
        }
        mockPendente = [data: [results: receitas]]
    }

    // ----------------------------------------------------------------- When

    @When("^I look for recipes with my pantry\$")
    public void procurarReceitas() {
        WebUI.navigateToUrl(Suporte.BASE_URL)
        WebUI.waitForElementClickable(Suporte.porTestId('recipes-link'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('recipes-link'))
        WebUI.waitForElementPresent(Suporte.porTestId('recipes-view'), Suporte.ESPERA)

        WebUI.executeJavaScript('window.__SMARTPANTRY_SPOONACULAR_MOCK__ = JSON.parse(arguments[0])',
            [JsonOutput.toJson(mockPendente ?: [data: [results: []]])])

        WebUI.waitForElementClickable(Suporte.porTestId('recipes-search'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('recipes-search'))
        WebUI.waitForElementNotPresent(Suporte.porTestId('genai-loading'), Suporte.ESPERA)
        WebUI.waitForElementVisible(Suporte.porTestId('recipes-grid'), Suporte.ESPERA)
    }

    // ----------------------------------------------------------------- Then

    @Then("^the recipe \"([^\"]*)\" marks \"([^\"]*)\" as in the pantry\$")
    public void ingredienteNaDespensa(String titulo, String ingrediente) {
        WebUI.verifyElementAttributeValue(
            dentroDoCartao(titulo, "[data-testid='recipe-ingredient'][data-name='" + ingrediente + "']"),
            'data-in-pantry', 'true', Suporte.ESPERA)
    }

    @Then("^the recipe \"([^\"]*)\" marks \"([^\"]*)\" as missing\$")
    public void ingredienteEmFalta(String titulo, String ingrediente) {
        WebUI.verifyElementAttributeValue(
            dentroDoCartao(titulo, "[data-testid='recipe-ingredient'][data-name='" + ingrediente + "']"),
            'data-in-pantry', 'false', Suporte.ESPERA)
    }

    @Then("^the recipe \"([^\"]*)\" shows \"([^\"]*)\"\$")
    public void receitaMostraTexto(String titulo, String texto) {
        TestObject alvo = dentroDoCartao(titulo, "[data-testid='recipe-coverage-text']")
        WebUI.waitForElementVisible(alvo, Suporte.ESPERA)
        String atual = WebUI.getText(alvo).trim()
        if (atual != texto) {
            KeywordUtil.markFailed("Esperava '" + texto + "' em '" + titulo + "' e vi '" + atual + "'.")
        }
    }

    @Then("^the progress indicator of \"([^\"]*)\" is at (\\d+)%\$")
    public void indicadorProgresso(String titulo, int percentagem) {
        TestObject barra = dentroDoCartao(titulo, "[data-testid='recipe-coverage-bar']")
        WebUI.verifyElementVisible(barra)
        WebUI.verifyElementAttributeValue(barra, 'role', 'progressbar', Suporte.ESPERA)
        WebUI.verifyElementAttributeValue(barra, 'aria-valuenow', String.valueOf(percentagem), Suporte.ESPERA)
    }

    @Then("^the recipes are shown in the order \"([^\"]*)\", \"([^\"]*)\", \"([^\"]*)\"\$")
    public void ordemDasReceitas(String primeira, String segunda, String terceira) {
        List titulos = (List) WebUI.executeJavaScript('''
            return Array.prototype.map.call(
                document.querySelectorAll("[data-testid='recipe-card']"),
                function (c) { return c.getAttribute('data-title') })
        ''', null)
        List esperado = [primeira, segunda, terceira]
        if (titulos != esperado) {
            KeywordUtil.markFailed("Ordem esperada " + esperado + " mas vi " + titulos + ".")
        }
    }
}
