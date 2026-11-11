package smartpantry.steps

import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-105 — Step definitions for switching the active profile (US-02).
 *
 * "I open the app" is reused from OnboardingSteps and must not be redefined
 * here, or Cucumber reports a duplicate step definition.
 */
public class ProfileSteps {

    // ---------------------------------------------------------------- Given

    /**
     * The app has no screen to create a second profile, so both profiles are
     * written straight into IndexedDB. The app is opened first so that Dexie
     * creates the database and its tables before anything is inserted.
     */
    @Given("^there is a default profile \"([^\"]*)\" and another profile \"([^\"]*)\"\$")
    public void thereAreTwoProfiles(String defaultName, String otherName) {
        WebUI.navigateToUrl(Suporte.BASE_URL)
        WebUI.waitForPageLoad(Suporte.ESPERA)
        // With no profiles the router guard sends the user to onboarding,
        // which proves the database has been opened.
        WebUI.waitForElementPresent(Suporte.porTestId('onboarding'), Suporte.ESPERA)

        WebUI.executeJavaScript('''
            var predefinido = arguments[0]
            var outro = arguments[1]
            window.__perfisCriados = null

            try { localStorage.removeItem('smartpantry.activeProfileId') } catch (e) {}

            var pedido = indexedDB.open('smartpantry')
            pedido.onsuccess = function (evento) {
                var bd = evento.target.result
                if (!bd.objectStoreNames.contains('profiles')) {
                    bd.close()
                    window.__perfisCriados = 'sem-tabela'
                    return
                }
                var base = { servings: 2, diets: [], allergies: [], excludedIngredients: [] }
                var transacao = bd.transaction('profiles', 'readwrite')
                var tabela = transacao.objectStore('profiles')
                tabela.clear()
                tabela.add(Object.assign({}, base, { name: predefinido, isDefault: true }))
                tabela.add(Object.assign({}, base, { name: outro, isDefault: false }))
                transacao.oncomplete = function () { bd.close(); window.__perfisCriados = 'ok' }
                transacao.onerror = function () { bd.close(); window.__perfisCriados = 'erro' }
            }
            pedido.onerror = function () { window.__perfisCriados = 'erro' }
        ''', [defaultName, otherName])

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

    @When("^I open the profile menu\$")
    public void iOpenTheProfileMenu() {
        WebUI.waitForElementClickable(Suporte.porTestId('profile-switcher-toggle'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('profile-switcher-toggle'))
        WebUI.waitForElementPresent(Suporte.porTestId('profile-menu'), Suporte.ESPERA)
    }

    @When("^I switch to the profile \"([^\"]*)\"\$")
    public void iSwitchToTheProfile(String name) {
        iOpenTheProfileMenu()
        WebUI.click(opcaoDoPerfil(name))
        WebUI.waitForElementNotPresent(Suporte.porTestId('profile-menu'), Suporte.ESPERA)
    }

    // ----------------------------------------------------------------- Then

    @Then("^the header shows \"([^\"]*)\" as the active profile\$")
    public void theHeaderShowsActiveProfile(String name) {
        WebUI.waitForElementPresent(Suporte.porTestId('active-profile-name'), Suporte.ESPERA)
        WebUI.verifyElementText(Suporte.porTestId('active-profile-name'), name)
    }

    @Then("^the profile menu lists \"([^\"]*)\" and \"([^\"]*)\"\$")
    public void theProfileMenuLists(String first, String second) {
        WebUI.verifyElementPresent(opcaoDoPerfil(first), Suporte.ESPERA)
        WebUI.verifyElementPresent(opcaoDoPerfil(second), Suporte.ESPERA)
    }

    // ------------------------------------------------------------- helpers

    private static opcaoDoPerfil(String name) {
        return Suporte.porCss("[data-testid='profile-option'][data-profile-name='" + name + "']")
    }
}