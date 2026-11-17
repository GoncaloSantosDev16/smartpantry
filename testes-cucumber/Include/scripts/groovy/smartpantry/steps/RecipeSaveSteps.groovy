package smartpantry.steps

import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-99 — Step definitions for recipes-guardar.feature (US-13).
 *
 * The browser is opened and closed by Hooks.groovy, and the onboarding step
 * ("I have completed the onboarding") lives in OnboardingSteps.groovy. Elements
 * are located through the data-testid attributes of RecipeDetailView.vue.
 *
 * "I open a generated recipe" uses the development-only route /receitas/demo,
 * which opens a sample recipe in the same format the GenAI Sous-Chef returns.
 */
public class RecipeSaveSteps {

    // ----------------------------------------------------------------- Given / When

    @Given("^I open a generated recipe\$")
    public void iOpenAGeneratedRecipe() {
        WebUI.navigateToUrl(Suporte.BASE_URL + '/receitas/demo')
        WebUI.waitForElementPresent(Suporte.porTestId('recipe-title'), Suporte.ESPERA)
    }

    @When("^I save the recipe\$")
    public void iSaveTheRecipe() {
        WebUI.waitForElementClickable(Suporte.porTestId('save-recipe'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('save-recipe'))
    }

    // Não se reutiliza "I reload the app" (ShoppingListSteps): esse passo espera pelo
    // botão da lista de compras, que só existe na página inicial.
    @When("^I reload the recipe page\$")
    public void iReloadTheRecipePage() {
        WebUI.refresh()
        WebUI.waitForPageLoad(Suporte.ESPERA)
        WebUI.waitForElementPresent(Suporte.porTestId('recipe-title'), Suporte.ESPERA)
    }

    // ----------------------------------------------------------------------- Then

    @Then("^I see the recipe details\$")
    public void iSeeTheRecipeDetails() {
        WebUI.verifyElementPresent(Suporte.porTestId('recipe-title'), Suporte.ESPERA)

        int ingredientes = WebUI.findWebElements(Suporte.porTestId('recipe-ingredient'), Suporte.ESPERA).size()
        int passos = WebUI.findWebElements(Suporte.porTestId('recipe-step'), Suporte.ESPERA).size()

        if (ingredientes == 0) {
            KeywordUtil.markFailed('The recipe has no ingredients on screen.')
        }
        if (passos == 0) {
            KeywordUtil.markFailed('The recipe has no steps on screen.')
        }
    }

    @Then("^the recipe is not saved yet\$")
    public void theRecipeIsNotSavedYet() {
        WebUI.verifyElementPresent(Suporte.porTestId('save-recipe'), Suporte.ESPERA)
        WebUI.verifyElementNotPresent(Suporte.porTestId('saved-badge'), 2)
    }

    @Then("^the recipe is marked as saved\$")
    public void theRecipeIsMarkedAsSaved() {
        WebUI.verifyElementPresent(Suporte.porTestId('saved-badge'), Suporte.ESPERA)
        WebUI.verifyElementNotPresent(Suporte.porTestId('save-recipe'), 2)
        WebUI.verifyElementNotPresent(Suporte.porTestId('save-error'), 2)
    }

    @Then("^the recipe \"([^\"]*)\" is still saved\$")
    public void theRecipeIsStillSaved(String titulo) {
        // Depois de guardar o URL passa a /receitas/<id>; ao recarregar a receita
        // é lida do IndexedDB, por isso isto prova que ficou gravada.
        WebUI.waitForElementPresent(Suporte.porTestId('recipe-title'), Suporte.ESPERA)
        WebUI.verifyElementText(Suporte.porTestId('recipe-title'), titulo)
        WebUI.verifyElementPresent(Suporte.porTestId('saved-badge'), Suporte.ESPERA)
    }
}
