package smartpantry.steps

import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-131 — Step definitions for ConsumedIngredientsSummary.feature (US-21).
 *
 * Reused steps: "I have completed the onboarding" (OnboardingSteps),
 * "the pantry contains:" (RecipeCoverageSteps), "I open a generated recipe"
 * (RecipeSaveSteps) and the pantry checks from PantryManagementSteps.
 * Elements are located through the data-testid attributes of MealSummaryView.vue.
 */
public class ConsumedIngredientsSummarySteps {

    private static String linha(String nome) {
        return "[data-testid='consumed-item'][data-name='" + nome + "']"
    }

    private static TestObject naLinha(String nome, String testId) {
        return Suporte.porCss(linha(nome) + " [data-testid='" + testId + "']")
    }

    /** Escreve na quantidade de uma linha e avisa o Vue (o v-model reage ao evento 'input'). */
    private static void escreverQuantidade(String nome, String valor) {
        Object ok = WebUI.executeJavaScript('''
            var campo = document.querySelector(arguments[0] + " [data-testid='consumed-item-qty']")
            if (!campo) { return false }
            var setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(campo), 'value').set
            setter.call(campo, arguments[1])
            campo.dispatchEvent(new Event('input', { bubbles: true }))
            return true
        ''', [linha(nome), valor])
        if (!ok) {
            KeywordUtil.markFailedAndStop("The summary has no quantity field for '" + nome + "'.")
        }
    }

    // ----------------------------------------------------------------- When

    @When("^I finish cooking the recipe\$")
    public void terminarReceita() {
        WebUI.waitForElementClickable(Suporte.porTestId('finish-recipe'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('finish-recipe'))
        WebUI.waitForElementPresent(Suporte.porTestId('meal-summary'), Suporte.ESPERA)
    }

    @When("^I change the quantity used of \"([^\"]*)\" to \"([^\"]*)\"\$")
    public void mudarQuantidade(String nome, String valor) {
        WebUI.waitForElementPresent(naLinha(nome, 'consumed-item-qty'), Suporte.ESPERA)
        escreverQuantidade(nome, valor)
    }

    @When("^I mark \"([^\"]*)\" as not used\$")
    public void marcarNaoUsado(String nome) {
        WebUI.click(naLinha(nome, 'consumed-item-toggle'))
        WebUI.verifyElementAttributeValue(Suporte.porCss(linha(nome)), 'data-included', 'false', Suporte.ESPERA)
    }

    @When("^I confirm the summary\$")
    public void confirmarResumo() {
        WebUI.waitForElementClickable(Suporte.porTestId('meal-summary-confirm'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('meal-summary-confirm'))
        WebUI.waitForElementPresent(Suporte.porTestId('meal-summary-done'), Suporte.ESPERA)
    }

    @When("^I go back to the pantry\$")
    public void voltarDespensa() {
        WebUI.click(Suporte.porTestId('meal-summary-home'))
        WebUI.waitForElementPresent(Suporte.porTestId('input-name'), Suporte.ESPERA)
    }

    // ----------------------------------------------------------------- Then

    @Then("^I see the summary of the ingredients used\$")
    public void vejoResumo() {
        WebUI.verifyElementVisible(Suporte.porTestId('meal-summary'))
        WebUI.verifyElementText(Suporte.porTestId('meal-summary-title'), 'Arroz de frango com legumes')
    }

    @Then("^the summary proposes using \"([^\"]*)\" \"([^\"]*)\" of \"([^\"]*)\"\$")
    public void resumoPropoe(String quantidade, String unidade, String nome) {
        WebUI.waitForElementPresent(naLinha(nome, 'consumed-item-qty'), Suporte.ESPERA)
        String valor = WebUI.getAttribute(naLinha(nome, 'consumed-item-qty'), 'value')
        if (Double.parseDouble(valor) != Double.parseDouble(quantidade)) {
            KeywordUtil.markFailed("Expected " + quantidade + " for '" + nome + "' but the summary shows " + valor + ".")
        }
        WebUI.verifyElementText(naLinha(nome, 'consumed-item-unit'), unidade)
        WebUI.verifyElementAttributeValue(Suporte.porCss(linha(nome)), 'data-included', 'true', Suporte.ESPERA)
    }

    @Then("^the summary shows \"([^\"]*)\" as not in the pantry\$")
    public void foraDaDespensa(String nome) {
        WebUI.verifyElementPresent(
            Suporte.porCss("[data-testid='not-in-pantry-item'][data-name='" + nome + "']"), Suporte.ESPERA)
        WebUI.verifyElementNotPresent(Suporte.porCss(linha(nome)), 2)
    }

    @Then("^I am told the pantry was updated\$")
    public void despensaAtualizada() {
        WebUI.verifyElementVisible(Suporte.porTestId('meal-summary-done'))
        WebUI.verifyElementNotPresent(Suporte.porTestId('meal-summary-confirm'), 2)
    }

    @Then("^I see an error on \"([^\"]*)\" in the summary\$")
    public void vejoErro(String nome) {
        WebUI.waitForElementVisible(naLinha(nome, 'consumed-item-error'), Suporte.ESPERA)
    }

    @Then("^I cannot confirm the summary\$")
    public void naoPossoConfirmar() {
        WebUI.verifyElementHasAttribute(Suporte.porTestId('meal-summary-confirm'), 'disabled', Suporte.ESPERA)
    }
}
