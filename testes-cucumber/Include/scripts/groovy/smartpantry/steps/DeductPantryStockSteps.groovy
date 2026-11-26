package smartpantry.steps

import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-137 — Step definitions for DeductPantryStock.feature (US-22).
 *
 * The other steps are reused: ConsumedIngredientsSummarySteps (summary of
 * US-21), RecipeCoverageSteps ("the pantry contains:"), RecipeSuggestionsSteps
 * ("the pantry is empty"), ShoppingListSteps ("I reload the app") and
 * PantryManagementSteps (pantry checks).
 */
public class DeductPantryStockSteps {

    @When("^I skip updating the pantry\$")
    public void saltar() {
        WebUI.waitForElementClickable(Suporte.porTestId('meal-summary-skip'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('meal-summary-skip'))
        WebUI.waitForElementPresent(Suporte.porTestId('meal-summary-skipped'), Suporte.ESPERA)
    }

    @Then("^I am told the pantry was not changed\$")
    public void despensaNaoAlterada() {
        WebUI.verifyElementVisible(Suporte.porTestId('meal-summary-skipped'))
        WebUI.verifyElementNotPresent(Suporte.porTestId('meal-summary-done'), 2)
    }

    @Then("^I am told none of the ingredients are in the pantry\$")
    public void nenhumIngredienteNaDespensa() {
        WebUI.verifyElementVisible(Suporte.porTestId('meal-summary-empty'))
        WebUI.verifyElementHasAttribute(Suporte.porTestId('meal-summary-confirm'), 'disabled', Suporte.ESPERA)
    }
}
