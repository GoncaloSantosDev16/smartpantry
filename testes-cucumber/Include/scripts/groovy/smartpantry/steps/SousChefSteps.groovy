package smartpantry.steps

import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import groovy.json.JsonOutput
import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * US-17 — Step definitions for SousChef.feature.
 *
 * Reutiliza dois passos que já existem: "I have completed the onboarding"
 * (OnboardingSteps) e "the pantry has the following items:" / "the pantry is empty"
 * (RecipeSuggestionsSteps). A API de IA é simulada com o hook de desenvolvimento
 * window.__SMARTPANTRY_GENAI_MOCK__ de genai.js (só existe em `npm run dev`).
 */
public class SousChefSteps {

    private static final Map RECEITA_SIMULADA = [
        title          : 'Arroz com ovos',
        description    : 'Um prato rápido com as sobras.',
        prepTimeMinutes: 5,
        cookTimeMinutes: 15,
        servings       : 2,
        ingredients    : [[name: 'Arroz', quantity: 200, unit: 'g'], [name: 'Ovos', quantity: 2, unit: 'un']],
        steps          : [[text: 'Coze o arroz.', timerSeconds: 900], [text: 'Junta os ovos mexidos.', timerSeconds: null]],
    ]

    // Aplica-se depois de abrir o Sous-Chef: a navegação dentro da SPA mantém o window.
    private Map mockPendente = null

    // ---------------------------------------------------------------- helpers

    private static TestObject linhaDaSobra(String nome, String relativo) {
        String xpath = "//*[@data-testid='leftover-item'][.//*[@data-testid='leftover-name' and normalize-space(.)='" + nome + "']]" + relativo
        TestObject objeto = new TestObject(xpath)
        objeto.addProperty('xpath', ConditionType.EQUALS, xpath)
        return objeto
    }

    private static void aplicarMock(Map mock) {
        WebUI.executeJavaScript('window.__SMARTPANTRY_GENAI_MOCK__ = JSON.parse(arguments[0])', [JsonOutput.toJson(mock)])
    }

    private static String pedidoFeito() {
        return String.valueOf(WebUI.executeJavaScript('''
            var mock = window.__SMARTPANTRY_GENAI_MOCK__ || {}
            return mock.lastRequest ? mock.lastRequest.prompt : ""
        ''', null))
    }

    // ----------------------------------------------------------------- Given

    @Given("^the AI will return the mocked recipe\$")
    public void iaDevolveReceita() {
        mockPendente = [data: RECEITA_SIMULADA]
    }

    @Given("^the AI will fail with \"([^\"]*)\"\$")
    public void iaFalha(String codigo) {
        mockPendente = [error: codigo]
    }

    // ------------------------------------------------------------------ When

    @When("^I open the Sous-Chef from the header\$")
    public void abrirSousChef() {
        // Recarrega o dashboard para garantir que a despensa preparada já foi lida.
        WebUI.navigateToUrl(Suporte.BASE_URL)
        WebUI.waitForElementClickable(Suporte.porTestId('sous-chef-link'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('sous-chef-link'))
        WebUI.waitForElementPresent(Suporte.porTestId('sous-chef-view'), Suporte.ESPERA)
        WebUI.waitForElementNotPresent(Suporte.porTestId('sous-chef-loading-pantry'), Suporte.ESPERA)

        if (mockPendente != null) {
            aplicarMock(mockPendente)
        }
    }

    @When("^I select the leftover \"([^\"]*)\"\$")
    public void escolherSobra(String nome) {
        TestObject caixa = linhaDaSobra(nome, "//input[@type='checkbox']")
        WebUI.waitForElementClickable(caixa, Suporte.ESPERA)
        WebUI.click(caixa)
    }

    @When("^I generate the recipe\$")
    public void gerarReceita() {
        WebUI.waitForElementClickable(Suporte.porTestId('sous-chef-generate'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('sous-chef-generate'))
        WebUI.waitForElementNotPresent(Suporte.porTestId('genai-loading'), Suporte.ESPERA)
    }

    // ------------------------------------------------------------------ Then

    @Then("^the generate button is disabled\$")
    public void botaoDesativado() {
        WebUI.verifyElementHasAttribute(Suporte.porTestId('sous-chef-generate'), 'disabled', Suporte.ESPERA)
    }

    @Then("^the generate button is enabled\$")
    public void botaoAtivo() {
        WebUI.verifyElementNotHasAttribute(Suporte.porTestId('sous-chef-generate'), 'disabled', Suporte.ESPERA)
    }

    @Then("^the AI was asked to use \"([^\"]*)\" and \"([^\"]*)\" but not \"([^\"]*)\"\$")
    public void pedidoComSobras(String a, String b, String excluida) {
        String prompt = pedidoFeito()
        if (!prompt.contains('- ' + a) || !prompt.contains('- ' + b)) {
            KeywordUtil.markFailed('The AI request should include "' + a + '" and "' + b + '" but it was: ' + prompt)
        }
        if (prompt.contains(excluida)) {
            KeywordUtil.markFailed('The AI request should not include "' + excluida + '" but it was: ' + prompt)
        }
    }

    @Then("^I see the details of the generated recipe \"([^\"]*)\"\$")
    public void detalhesDaReceitaGerada(String titulo) {
        WebUI.waitForElementPresent(Suporte.porTestId('recipe-title'), Suporte.ESPERA)
        WebUI.verifyElementText(Suporte.porTestId('recipe-title'), titulo)
        // Ainda não está guardada: a gravação é uma escolha do utilizador (US-13)
        WebUI.verifyElementPresent(Suporte.porTestId('save-recipe'), Suporte.ESPERA)
    }

    @Then("^I see the Sous-Chef error \"([^\"]*)\"\$")
    public void erroDoSousChef(String texto) {
        WebUI.waitForElementPresent(Suporte.porTestId('genai-error'), Suporte.ESPERA)
        String mensagem = WebUI.getText(Suporte.porTestId('genai-error'))
        if (!mensagem.contains(texto)) {
            KeywordUtil.markFailed('Expected the error to contain "' + texto + '" but it was: ' + mensagem)
        }
    }

    @Then("^I can try the generation again\$")
    public void podeTentarOutraVez() {
        WebUI.verifyElementPresent(Suporte.porTestId('genai-retry'), Suporte.ESPERA)
    }

    @Then("^I see the empty pantry message of the Sous-Chef\$")
    public void despensaVaziaNoSousChef() {
        WebUI.verifyElementPresent(Suporte.porTestId('sous-chef-empty'), Suporte.ESPERA)
    }
}
