package smartpantry.steps

import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-69 — Step definitions for the onboarding feature.
 *
 * Merges the two implementations that existed in the project into one: the
 * default-profile scenario (SCRUM-29) and the first-launch and validation
 * scenarios (SCRUM-65, SCRUM-67). A single implementation avoids the
 * "duplicate step definitions" error Cucumber raises when two classes define
 * the same step text.
 *
 * The browser is opened and closed by Hooks.groovy, so no step opens it.
 *
 * Expressions are written as regex rather than Cucumber Expressions for
 * compatibility with every Cucumber version Katalon has shipped.
 */
public class OnboardingSteps {

    // ---------------------------------------------------------------- Given

    @Given("^the app has no saved data\$")
    public void appHasNoSavedData() {
        WebUI.navigateToUrl(Suporte.BASE_URL)
        WebUI.waitForPageLoad(Suporte.ESPERA)
        Suporte.limparPerfis()
    }

    @Given("^I have completed the onboarding\$")
    public void iHaveCompletedOnboarding() {
        WebUI.navigateToUrl(Suporte.BASE_URL)
        WebUI.waitForPageLoad(Suporte.ESPERA)
        Suporte.limparPerfis()
        Suporte.completarOnboarding()
    }

    // ----------------------------------------------------------------- When

    @When("^I open the app\$")
    public void iOpenTheApp() {
        WebUI.navigateToUrl(Suporte.BASE_URL)
        WebUI.waitForPageLoad(Suporte.ESPERA)
    }

    @When("^I open the onboarding screen directly\$")
    public void iOpenOnboardingDirectly() {
        WebUI.navigateToUrl(Suporte.BASE_URL + '/onboarding')
        WebUI.waitForPageLoad(Suporte.ESPERA)
    }

    @When("^I clear the profile name\$")
    public void iClearTheProfileName() {
        WebUI.waitForElementPresent(Suporte.porTestId('profile-name'), Suporte.ESPERA)
        Suporte.escreverCampo('profile-name', '')
    }

    @When("^I set (\\d+) servings?\$")
    public void iSetServings(int target) {
        WebUI.waitForElementPresent(Suporte.porTestId('servings-value'), Suporte.ESPERA)
        int current = Integer.parseInt(WebUI.getText(Suporte.porTestId('servings-value')).trim())

        while (current < target) {
            WebUI.click(Suporte.porTestId('servings-plus'))
            current++
        }
        while (current > target) {
            WebUI.click(Suporte.porTestId('servings-minus'))
            current--
        }
    }

    @When("^I set (\\d+) people, the \"([^\"]*)\" diet and the \"([^\"]*)\" allergy\$")
    public void iSetPeopleDietAndAllergy(int people, String diet, String allergy) {
        // Step 1 — servings (the number of people was previously ignored)
        iSetServings(people)
        WebUI.click(Suporte.porTestId('onboarding-next'))

        // Step 2 — diet
        WebUI.waitForElementClickable(Suporte.porTestId('diet-' + diet), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('diet-' + diet))
        WebUI.click(Suporte.porTestId('onboarding-next'))

        // Step 3 — allergy
        iAddTheAllergy(allergy)
    }

    @When("^I go to the last step\$")
    public void iGoToTheLastStep() {
        WebUI.waitForElementPresent(Suporte.porTestId('onboarding-next'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('onboarding-next'))
        WebUI.click(Suporte.porTestId('onboarding-next'))
        WebUI.waitForElementPresent(Suporte.porTestId('onboarding-finish'), Suporte.ESPERA)
    }

    @When("^I add the allergy \"([^\"]*)\"\$")
    public void iAddTheAllergy(String allergy) {
        WebUI.waitForElementPresent(Suporte.porTestId('allergy-input'), Suporte.ESPERA)
        Suporte.escreverCampo('allergy-input', allergy)
        WebUI.click(Suporte.porTestId('allergy-add'))
    }

    @When("^I confirm the onboarding\$")
    public void iConfirmTheOnboarding() {
        WebUI.waitForElementClickable(Suporte.porTestId('onboarding-finish'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('onboarding-finish'))
    }

    // ----------------------------------------------------------------- Then

    @Then("^I see the onboarding screen\$")
    public void iSeeTheOnboardingScreen() {
        WebUI.verifyElementPresent(Suporte.porTestId('onboarding'), Suporte.ESPERA)
    }

    @Then("^I see the dashboard\$")
    public void iSeeTheDashboard() {
        WebUI.waitForElementNotPresent(Suporte.porTestId('onboarding'), Suporte.ESPERA)
        WebUI.verifyElementNotPresent(Suporte.porTestId('onboarding'), Suporte.ESPERA)

        String url = WebUI.getUrl()
        KeywordUtil.logInfo('Current URL: ' + url)
        if (url.contains('/onboarding')) {
            KeywordUtil.markFailed('Expected the dashboard but still on onboarding: ' + url)
        }
    }

    @Then("^the default profile is saved\$")
    public void theDefaultProfileIsSaved() {
        // Reopen the app. If the profile was persisted, the router guard skips
        // onboarding; if it was not, the guard sends the user back to it.
        WebUI.navigateToUrl(Suporte.BASE_URL)
        WebUI.waitForPageLoad(Suporte.ESPERA)
        WebUI.verifyElementNotPresent(Suporte.porTestId('onboarding'), Suporte.ESPERA)
    }

    @Then("^I cannot continue to the next step\$")
    public void iCannotContinue() {
        WebUI.verifyElementHasAttribute(
            Suporte.porTestId('onboarding-next'), 'disabled', Suporte.ESPERA)
    }

    @Then("^I cannot decrease the number of servings\$")
    public void iCannotDecreaseServings() {
        WebUI.verifyElementHasAttribute(
            Suporte.porTestId('servings-minus'), 'disabled', Suporte.ESPERA)
    }

    @Then("^the allergy list has (\\d+) entr(?:y|ies)\$")
    public void allergyListHas(int expected) {
        int total = Suporte.contarEtiquetas('allergy')
        KeywordUtil.logInfo('Allergy tags found: ' + total)
        if (total != expected) {
            KeywordUtil.markFailed(
                'Expected ' + expected + ' allergy tag(s) but found ' + total)
        }
    }

    @Then("^the allergy list contains \"([^\"]*)\"\$")
    public void allergyListContains(String expected) {
        String text = Suporte.textoEtiquetas('allergy')
        KeywordUtil.logInfo('Allergy tags: ' + text)
        if (!text.contains(expected.toLowerCase())) {
            KeywordUtil.markFailed(
                'Expected to find "' + expected + '" in the allergies, but got: ' + text)
        }
    }
}