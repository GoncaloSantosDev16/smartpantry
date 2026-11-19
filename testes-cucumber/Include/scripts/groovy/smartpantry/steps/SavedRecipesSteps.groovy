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
 * SCRUM-102 — Step definitions for recipes-offline.feature (US-16).
 *
 * The browser is opened and closed by Hooks.groovy and the onboarding step lives
 * in OnboardingSteps.groovy. Recipes are seeded straight into the IndexedDB table
 * "recipes", so the saved recipes screen is proven to render what is in the
 * database and not what the UI just saved.
 */
public class SavedRecipesSteps {

    private static final String TESTID_CARTAO = 'recipe-card'

    // ---------------------------------------------------------------- helpers

    /** Cartão da lista cujo título é exatamente o indicado. */
    private static TestObject cartaoDaReceita(String titulo) {
        String xpath = "//*[@data-testid='" + TESTID_CARTAO + "'][.//*[@data-testid='recipe-card-title' and normalize-space(.)='" + titulo + "']]"
        TestObject objeto = new TestObject(xpath)
        objeto.addProperty('xpath', ConditionType.EQUALS, xpath)
        return objeto
    }

    private static int contarCartoes() {
        return WebUI.findWebElements(Suporte.porTestId(TESTID_CARTAO), 1).size()
    }

    /**
     * Acrescenta uma receita à tabela "recipes" do IndexedDB.
     * Segue o padrão de Suporte.limparPerfis(): o executeJavaScript não espera por
     * promessas, por isso marca-se uma flag no window e sonda-se até concluir.
     */
    private static void semearReceita(String titulo) {
        Map receita = [
            source         : 'genai',
            title          : titulo,
            description    : 'Receita de teste',
            prepTimeMinutes: 10,
            cookTimeMinutes: 25,
            servings       : 2,
            ingredients    : [[name: 'Arroz', quantity: 200, unit: 'g'], [name: 'Ovos', quantity: 2, unit: 'un']],
            steps          : [[text: 'Prepara os ingredientes.', timerSeconds: null], [text: 'Cozinha tudo.', timerSeconds: 900]],
            savedAt        : java.time.Instant.now().toString(),
            timesCooked    : 0,
        ]

        WebUI.executeJavaScript('''
            window.__semeadura = false
            var receita = JSON.parse(arguments[0])
            var pedido = indexedDB.open('smartpantry')
            pedido.onsuccess = function (evento) {
                var bd = evento.target.result
                var transacao = bd.transaction('recipes', 'readwrite')
                transacao.objectStore('recipes').add(receita)
                transacao.oncomplete = function () { bd.close(); window.__semeadura = true }
                transacao.onerror = function () { bd.close(); window.__semeadura = 'erro' }
            }
            pedido.onerror = function () { window.__semeadura = 'erro' }
        ''', [JsonOutput.toJson(receita)])

        for (int tentativa = 0; tentativa < 10; tentativa++) {
            Object estado = WebUI.executeJavaScript('return window.__semeadura', null)
            if (estado == true) {
                return
            }
            if ('erro'.equals(estado)) {
                KeywordUtil.markFailed('Could not seed the recipe "' + titulo + '" into IndexedDB.')
                return
            }
            WebUI.delay(1)
        }
        KeywordUtil.markFailed('Timed out while seeding the recipe "' + titulo + '".')
    }

    // ----------------------------------------------------------------- Given

    @Given("^a saved recipe \"([^\"]*)\" exists\$")
    public void aSavedRecipeExists(String titulo) {
        // A base de dados só existe depois de a app ter arrancado uma vez
        // (o passo do onboarding já garante isso).
        semearReceita(titulo)
        // Garante que dois pedidos seguidos têm datas diferentes (ordem da lista)
        WebUI.delay(1)
    }

    // ------------------------------------------------------------------ When

    @When("^I open the saved recipes screen\$")
    public void iOpenTheSavedRecipesScreen() {
        WebUI.navigateToUrl(Suporte.BASE_URL + '/receitas/guardadas')
        WebUI.waitForElementPresent(Suporte.porTestId('recipes-screen'), Suporte.ESPERA)
        WebUI.waitForElementNotPresent(Suporte.porTestId('recipes-loading'), Suporte.ESPERA)
    }

    @When("^I open the saved recipe \"([^\"]*)\"\$")
    public void iOpenTheSavedRecipe(String titulo) {
        WebUI.click(cartaoDaReceita(titulo))
    }

    @When("^the device goes offline\$")
    public void theDeviceGoesOffline() {
        WebUI.executeJavaScript("window.dispatchEvent(new Event('offline'))", null)
    }

    @When("^the device goes back online\$")
    public void theDeviceGoesBackOnline() {
        WebUI.executeJavaScript("window.dispatchEvent(new Event('online'))", null)
    }

    // ------------------------------------------------------------------ Then

    @Then("^I see the empty recipes message\$")
    public void iSeeTheEmptyRecipesMessage() {
        WebUI.verifyElementPresent(Suporte.porTestId('recipes-empty'), Suporte.ESPERA)
        WebUI.verifyElementNotPresent(Suporte.porTestId(TESTID_CARTAO), 2)
    }

    @Then("^I see (\\d+) saved recipes?\$")
    public void iSeeSavedRecipes(int esperado) {
        int encontrado = -1
        for (int tentativa = 0; tentativa < Suporte.ESPERA; tentativa++) {
            encontrado = contarCartoes()
            if (encontrado == esperado) {
                return
            }
            WebUI.delay(1)
        }
        KeywordUtil.markFailed('Expected ' + esperado + ' saved recipe(s) but found ' + encontrado + '.')
    }

    @Then("^I see the saved recipe \"([^\"]*)\"\$")
    public void iSeeTheSavedRecipe(String titulo) {
        WebUI.verifyElementPresent(cartaoDaReceita(titulo), Suporte.ESPERA)
    }

    @Then("^I see the details of the saved recipe \"([^\"]*)\"\$")
    public void iSeeTheDetailsOfTheSavedRecipe(String titulo) {
        WebUI.waitForElementPresent(Suporte.porTestId('recipe-title'), Suporte.ESPERA)
        WebUI.verifyElementText(Suporte.porTestId('recipe-title'), titulo)
        WebUI.verifyElementPresent(Suporte.porTestId('saved-badge'), Suporte.ESPERA)
    }

    @Then("^I see the offline banner\$")
    public void iSeeTheOfflineBanner() {
        WebUI.verifyElementPresent(Suporte.porTestId('offline-banner'), Suporte.ESPERA)
    }

    @Then("^I do not see the offline banner\$")
    public void iDoNotSeeTheOfflineBanner() {
        WebUI.waitForElementNotPresent(Suporte.porTestId('offline-banner'), Suporte.ESPERA)
    }
}
