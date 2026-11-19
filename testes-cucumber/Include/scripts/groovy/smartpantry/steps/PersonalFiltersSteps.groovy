package smartpantry.steps

import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-123 — Step definitions for the personal filters on the recipes page (US-11).
 *
 * "I open the app" (OnboardingSteps) and "I switch to the profile" (ProfileSteps)
 * are reused and must not be redefined here.
 */
public class PersonalFiltersSteps {

    // ---------------------------------------------------------------- Given

    /**
     * Same approach as ProfileSteps, but each profile gets one allergy. The
     * saved toggle state is cleared so every scenario starts with the default.
     */
    @Given("^there is a default profile \"([^\"]*)\" allergic to \"([^\"]*)\" and another profile \"([^\"]*)\" allergic to \"([^\"]*)\"\$")
    public void thereAreTwoProfilesWithAllergies(String defaultName, String defaultAllergy,
            String otherName, String otherAllergy) {
        WebUI.navigateToUrl(Suporte.BASE_URL)
        WebUI.waitForPageLoad(Suporte.ESPERA)
        // With no profiles the router guard sends the user to onboarding,
        // which proves the database has been opened.
        WebUI.waitForElementPresent(Suporte.porTestId('onboarding'), Suporte.ESPERA)

        WebUI.executeJavaScript('''
            var perfis = [
                { name: arguments[0], allergies: [arguments[1]], isDefault: true },
                { name: arguments[2], allergies: [arguments[3]], isDefault: false }
            ]
            window.__perfisCriados = null

            try {
                localStorage.removeItem('smartpantry.activeProfileId')
                localStorage.removeItem('smartpantry.personalFilters')
            } catch (e) {}

            var pedido = indexedDB.open('smartpantry')
            pedido.onsuccess = function (evento) {
                var bd = evento.target.result
                if (!bd.objectStoreNames.contains('profiles')) {
                    bd.close()
                    window.__perfisCriados = 'sem-tabela'
                    return
                }
                var base = { servings: 2, diets: [], excludedIngredients: [] }
                var transacao = bd.transaction('profiles', 'readwrite')
                var tabela = transacao.objectStore('profiles')
                tabela.clear()
                perfis.forEach(function (p) { tabela.add(Object.assign({}, base, p)) })
                transacao.oncomplete = function () { bd.close(); window.__perfisCriados = 'ok' }
                transacao.onerror = function () { bd.close(); window.__perfisCriados = 'erro' }
            }
            pedido.onerror = function () { window.__perfisCriados = 'erro' }
        ''', [defaultName, defaultAllergy, otherName, otherAllergy])

        String estado = null
        for (int tentativa = 0; tentativa < 10; tentativa++) {
            estado = WebUI.executeJavaScript('return window.__perfisCriados', null)
            if (estado != null) break
            WebUI.delay(1)
        }
        if (estado != 'ok') {
            KeywordUtil.markFailedAndStop('Could not create the test profiles (state: ' + estado + ')')
        }
    }

    // ----------------------------------------------------------------- When

    @When("^I open the recipes page\$")
    public void iOpenTheRecipesPage() {
        WebUI.navigateToUrl(Suporte.BASE_URL + '/receitas')
        WebUI.waitForPageLoad(Suporte.ESPERA)
        WebUI.waitForElementPresent(Suporte.porTestId('personal-filters-toggle'), Suporte.ESPERA)
    }

    @When("^I turn the personal filters toggle (on|off)\$")
    public void iTurnTheToggle(String state) {
        boolean wanted = (state == 'on')
        if (toggleIsOn() != wanted) {
            WebUI.click(Suporte.porTestId('personal-filters-toggle'))
        }
        // Wait for Vue to re-render before the next step reads the state.
        for (int tentativa = 0; tentativa < 5 && toggleIsOn() != wanted; tentativa++) {
            WebUI.delay(1)
        }
    }

    // ----------------------------------------------------------------- Then

    @Then("^the personal filters toggle is (on|off)\$")
    public void theToggleIs(String state) {
        String expected = (state == 'on') ? 'true' : 'false'
        WebUI.verifyElementAttributeValue(
            Suporte.porTestId('personal-filters-toggle'), 'aria-checked', expected, Suporte.ESPERA)
    }

    @Then("^no personal restrictions are shown\$")
    public void noRestrictionsAreShown() {
        WebUI.verifyElementNotPresent(Suporte.porTestId('personal-restriction'), Suporte.ESPERA)
    }

    @Then("^the restrictions shown include \"([^\"]*)\"\$")
    public void restrictionsInclude(String value) {
        WebUI.verifyElementPresent(restricao(value), Suporte.ESPERA)
    }

    @Then("^the restrictions shown do not include \"([^\"]*)\"\$")
    public void restrictionsDoNotInclude(String value) {
        WebUI.verifyElementNotPresent(restricao(value), Suporte.ESPERA)
    }

    // ------------------------------------------------------------- helpers

    private static boolean toggleIsOn() {
        return WebUI.getAttribute(Suporte.porTestId('personal-filters-toggle'), 'aria-checked') == 'true'
    }

    private static restricao(String value) {
        return Suporte.porCss("[data-testid='personal-restriction'][data-restriction='" + value + "']")
    }
}