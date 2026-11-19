package smartpantry.steps

import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import io.cucumber.java.en.Given
import io.cucumber.java.en.When
import io.cucumber.java.en.Then

public class CustomCategoriesSteps {

    @Given('the user has completed onboarding and is on the pantry dashboard')
    public void setupPantryDashboard() {
        Suporte.completarOnboarding()
        WebUI.waitForElementPresent(Suporte.porTestId('home'), Suporte.ESPERA)
    }

    @Given('category {string} does not exist in the category list yet')
    public void verifyCategoryDoesNotExist(String categoryName) {
        WebUI.verifyElementNotPresent(
            Suporte.porCss("datalist#category-options option[value='${categoryName}']"),
            3
        )
    }

    @When('the user opens the new category modal')
    public void openNewCategoryModal() {
        WebUI.click(Suporte.porTestId('btn-new-category'))
    }

    @When('creates the custom category {string}')
    public void createCustomCategory(String categoryName) {
        def modalInput = Suporte.porCss("[role='dialog'] input, .fixed input")
        def submitButton = Suporte.porCss("[role='dialog'] button[type='submit'], .fixed button[type='submit']")

        WebUI.waitForElementVisible(modalInput, Suporte.ESPERA)
        WebUI.setText(modalInput, categoryName)
        WebUI.click(submitButton)
    }

    @When('attempts to create duplicate category {string}')
    public void attemptDuplicateCategory(String categoryName) {
        def modalInput = Suporte.porCss("[role='dialog'] input, .fixed input")
        def submitButton = Suporte.porCss("[role='dialog'] button[type='submit'], .fixed button[type='submit']")

        WebUI.waitForElementVisible(modalInput, Suporte.ESPERA)
        WebUI.setText(modalInput, categoryName)
        if (WebUI.verifyElementClickable(submitButton, FailureHandling.OPTIONAL)) {
            WebUI.click(submitButton)
        }
    }

    @Then('category {string} should be selected in the category field')
    public void verifyCategorySelected(String categoryName) {
        String currentValue = WebUI.getAttribute(Suporte.porTestId('input-category'), 'value')
        assert currentValue == categoryName : "Expected '${categoryName}', but found '${currentValue}'"
    }

    @Then('category {string} should be available in the category dropdown list')
    public void verifyCategoryInDropdownList(String categoryName) {
        def datalistOption = Suporte.porCss("datalist#category-options option[value='${categoryName}']")
        WebUI.verifyElementPresent(datalistOption, Suporte.ESPERA)

        // Clear the input field via Vue's 'input' event and verify the option remains available
        Suporte.escreverCampo('input-category', '')
        WebUI.verifyElementPresent(datalistOption, Suporte.ESPERA)
    }

    @Then('the modal should prevent creating the duplicate category')
    public void verifyDuplicateBlocked() {
        def modalInput = Suporte.porCss("[role='dialog'] input, .fixed input")
        WebUI.verifyElementVisible(modalInput)
    }
}