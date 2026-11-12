package smartpantry.steps

import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import groovy.json.JsonOutput
import io.cucumber.datatable.DataTable
import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-119 — Step definitions da US-09 (receitas com base na despensa).
 *
 * O Spoonacular é simulado: em desenvolvimento, o recipesApi.js usa
 * window.__SMARTPANTRY_SPOONACULAR_MOCK__ em vez de chamar a API (ver devMock()).
 * O browser é aberto e fechado pelo Hooks.groovy.
 */
public class RecipeSuggestionsSteps {

    /** Resposta simulada do /recipes/complexSearch (só os campos que a app usa). */
    private static final Map RESPOSTA_SIMULADA = [
        results: [
            [
                id                  : 101,
                title               : 'Tomato Rice',
                readyInMinutes      : 30,
                servings            : 2,
                extendedIngredients : [
                    [nameClean: 'rice', amount: 200, unit: 'g'],
                    [nameClean: 'tomato', amount: 2, unit: ''],
                    [nameClean: 'onion', amount: 1, unit: ''],
                ],
                analyzedInstructions: [[steps: [[number: 1, step: 'Cook the rice with the tomato.']]]],
            ],
            [
                id                  : 102,
                title               : 'Tomato Scrambled Eggs',
                readyInMinutes      : 10,
                servings            : 1,
                extendedIngredients : [
                    [nameClean: 'eggs', amount: 3, unit: ''],
                    [nameClean: 'tomato', amount: 1, unit: ''],
                ],
                analyzedInstructions: [[steps: [[number: 1, step: 'Scramble the eggs with the tomato.']]]],
            ],
        ],
    ]

    // Cucumber cria uma instância nova por cenário: estes campos não passam entre cenários.
    private Map mockPendente = null

    // ------------------------------------------------------------- helpers

    /** Substitui o conteúdo de pantryItems no IndexedDB (mesma técnica do Suporte.limparPerfis). */
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

    private static void aplicarMock(Map mock) {
        WebUI.executeJavaScript('window.__SMARTPANTRY_SPOONACULAR_MOCK__ = JSON.parse(arguments[0])', [JsonOutput.toJson(mock)])
    }

    private static int contarCartoes() {
        return WebUI.findWebElements(Suporte.porCss("[data-testid='recipe-card']"), 1).size()
    }

    // ---------------------------------------------------------------- Given

    @Given("^the pantry has the following items:\$")
    public void despensaComItens(DataTable tabela) {
        List<Map> itens = tabela.asMaps(String, String).collect { linha ->
            [name: linha.name, quantity: Double.parseDouble(linha.quantity), unit: linha.unit, category: 'Outro']
        }
        definirDespensa(itens)
    }

    @Given("^the pantry is empty\$")
    public void despensaVazia() {
        definirDespensa([])
    }

    @Given("^the recipe API will return the mocked recipes\$")
    public void apiDevolveReceitas() {
        mockPendente = [data: RESPOSTA_SIMULADA]
    }

    @Given("^the recipe API will return no recipes\$")
    public void apiSemReceitas() {
        mockPendente = [data: [results: []]]
    }

    @Given("^the recipe API will fail with \"([^\"]*)\"\$")
    public void apiFalha(String codigo) {
        mockPendente = [error: codigo]
    }

    // ----------------------------------------------------------------- When

    @When("^I open the recipe search from the header\$")
    public void abrirReceitas() {
        // Recarrega o dashboard para garantir que a despensa preparada já foi lida.
        WebUI.navigateToUrl(Suporte.BASE_URL)
        WebUI.waitForElementClickable(Suporte.porTestId('recipes-link'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('recipes-link'))
        WebUI.waitForElementPresent(Suporte.porTestId('recipes-view'), Suporte.ESPERA)

        // Navegação dentro da SPA: o window mantém-se, por isso o mock fica ativo.
        if (mockPendente != null) {
            aplicarMock(mockPendente)
        }
    }

    @When("^I search for recipes\$")
    public void pesquisar() {
        WebUI.waitForElementClickable(Suporte.porTestId('recipes-search'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('recipes-search'))
        WebUI.waitForElementNotPresent(Suporte.porTestId('genai-loading'), Suporte.ESPERA)
    }

    // ----------------------------------------------------------------- Then

    @Then("^the recipe API was asked for \"([^\"]*)\", \"([^\"]*)\" and \"([^\"]*)\"\$")
    public void pedidoComIngredientes(String a, String b, String c) {
        String pedidos = String.valueOf(WebUI.executeJavaScript('''
            var mock = window.__SMARTPANTRY_SPOONACULAR_MOCK__ || {}
            return mock.lastRequest ? mock.lastRequest.params.includeIngredients : ""
        ''', null))

        if (pedidos.isEmpty()) {
            KeywordUtil.markFailed('Não foi feito nenhum pedido à API de receitas.')
            return
        }
        List<String> enviados = pedidos.split(',') as List<String>
        [a, b, c].each { nome ->
            if (!enviados.contains(nome)) {
                KeywordUtil.markFailed("O pedido não inclui '" + nome + "' (enviado: " + pedidos + ").")
            }
        }
    }

    @Then("^I see (\\d+) recipe cards?\$")
    public void vejoCartoes(int esperado) {
        if (esperado > 0) {
            WebUI.waitForElementVisible(Suporte.porTestId('recipes-grid'), Suporte.ESPERA)
        }
        int total = contarCartoes()
        if (total != esperado) {
            KeywordUtil.markFailed("Esperava " + esperado + " receitas e vi " + total + ".")
        }
    }

    @Then("^the first recipe is \"([^\"]*)\"\$")
    public void primeiraReceita(String titulo) {
        WebUI.verifyElementAttributeValue(
            Suporte.porCss("[data-testid='recipe-card']:first-child"), 'data-title', titulo, Suporte.ESPERA)
    }

    @Then("^the recipe \"([^\"]*)\" has (\\d+) of (\\d+) ingredients in the pantry\$")
    public void receitaComIngredientes(String titulo, int naDespensa, int total) {
        def cartao = Suporte.porCss("[data-testid='recipe-card'][data-title='" + titulo + "']")
        WebUI.verifyElementAttributeValue(cartao, 'data-matched', String.valueOf(naDespensa), Suporte.ESPERA)
        WebUI.verifyElementAttributeValue(cartao, 'data-total', String.valueOf(total), Suporte.ESPERA)
    }

    @Then("^I am told no recipes were found\$")
    public void semResultados() {
        WebUI.verifyElementVisible(Suporte.porTestId('recipes-no-results'))
    }

    @Then("^I see the recipe search error\$")
    public void vejoErro() {
        WebUI.verifyElementVisible(Suporte.porTestId('genai-error'))
    }

    @Then("^I am told the pantry is empty\$")
    public void despensaVaziaAviso() {
        WebUI.verifyElementVisible(Suporte.porTestId('recipes-empty-pantry'))
    }

    @Then("^I cannot search for recipes\$")
    public void botaoDesativado() {
        WebUI.verifyElementNotClickable(Suporte.porTestId('recipes-search'))
    }
}
