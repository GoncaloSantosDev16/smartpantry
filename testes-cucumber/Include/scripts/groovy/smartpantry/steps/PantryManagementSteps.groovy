package smartpantry.steps

import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * US-03 / US-04 — Pantry management (add, validate, edit, cancel, remove).
 *
 * Os elementos são localizados pelos data-testid da HomeView.
 * O browser é aberto e fechado pelo Hooks.groovy; o onboarding vem do OnboardingSteps
 * e a remoção ("I remove the product … from the pantry") do ExpiringAlertSteps.
 */
public class PantryManagementSteps {

    // ------------------------------------------------------------- helpers

    private static TestObject nameInList(String name) {
        return Suporte.porCss("[data-testid='pantry-item'][data-name='" + name + "'] [data-testid='pantry-item-name']")
    }

    private static TestObject itemAction(String name, String testId) {
        return Suporte.porCss("[data-testid='pantry-item'][data-name='" + name + "'] [data-testid='" + testId + "']")
    }

    private static void waitForForm() {
        WebUI.waitForElementVisible(Suporte.porTestId('input-name'), Suporte.ESPERA)
    }

    private static void verifyCreateMode() {
        String title = WebUI.getText(Suporte.porTestId('form-title'))
        if (!title.contains('Novo Ingrediente')) {
            KeywordUtil.markFailed("O formulário devia estar em modo de criação, mas o título é '" + title + "'.")
        }
        WebUI.verifyElementNotPresent(Suporte.porTestId('btn-cancel-edit'), 3)
    }

    // ---------------------------------------------------------------- Given

    @Given("^the pantry has the product \"([^\"]*)\"\$")
    public void pantryHasProduct(String name) {
        waitForForm()
        Suporte.escreverCampo('input-name', name)
        WebUI.click(Suporte.porTestId('btn-add-item'))
        WebUI.waitForElementPresent(nameInList(name), Suporte.ESPERA)
    }

    // ----------------------------------------------------------------- When

    @When("^I fill in the product name with \"([^\"]*)\"\$")
    public void fillName(String name) {
        waitForForm()
        Suporte.escreverCampo('input-name', name)
    }

    @When("^I choose the category \"([^\"]*)\"\$")
    public void chooseCategory(String category) {
        // A categoria é um campo de texto com sugestões (datalist)
        Suporte.escreverCampo('input-category', category)
    }

    @When("^I set the product quantity to \"([^\"]*)\"\$")
    public void setQuantity(String quantity) {
        Suporte.escreverCampo('input-quantity', quantity)
    }

    @When("^I submit the product form\$")
    public void submitForm() {
        WebUI.click(Suporte.porTestId('btn-add-item'))
    }

    @When("^I submit the product form without a name\$")
    public void submitWithoutName() {
        waitForForm()
        Suporte.escreverCampo('input-name', '')
        WebUI.click(Suporte.porTestId('btn-add-item'))
    }

    @When("^I edit the product \"([^\"]*)\"\$")
    public void editProduct(String name) {
        WebUI.click(itemAction(name, 'btn-edit-item'))
        WebUI.waitForElementPresent(Suporte.porTestId('btn-cancel-edit'), Suporte.ESPERA)
    }

    @When("^I cancel the edit\$")
    public void cancelEdit() {
        WebUI.click(Suporte.porTestId('btn-cancel-edit'))
    }

    // ----------------------------------------------------------------- Then

    @Then("^the pantry lists the product \"([^\"]*)\"\$")
    public void pantryListsProduct(String name) {
        WebUI.waitForElementVisible(nameInList(name), Suporte.ESPERA)
    }

    @Then("^the pantry lists the product \"([^\"]*)\" with quantity \"([^\"]*)\"\$")
    public void pantryListsProductWithQuantity(String name, String quantity) {
        WebUI.waitForElementVisible(nameInList(name), Suporte.ESPERA)
        String shown = WebUI.getText(itemAction(name, 'pantry-item-qty')).trim()
        if (!shown.startsWith(quantity + ' ')) {
            KeywordUtil.markFailed("Esperava a quantidade " + quantity + " em '" + name + "' e vi '" + shown + "'.")
        }
    }

    @Then("^the pantry no longer lists the product \"([^\"]*)\"\$")
    public void pantryNoLongerLists(String name) {
        WebUI.verifyElementNotPresent(nameInList(name), Suporte.ESPERA)
    }

    @Then("^I see an error saying the product name is required\$")
    public void nameRequiredError() {
        TestObject error = Suporte.porTestId('error-name')
        WebUI.waitForElementVisible(error, Suporte.ESPERA)
        if (!WebUI.getText(error).contains('obrigatório')) {
            KeywordUtil.markFailed('A mensagem de erro não indica que o nome é obrigatório.')
        }
    }

    @Then("^the product form is back in create mode\$")
    public void formInCreateMode() {
        verifyCreateMode()
    }

    @Then("^the product form is cleared and back in create mode\$")
    public void formClearedInCreateMode() {
        verifyCreateMode()
        WebUI.verifyElementAttributeValue(Suporte.porTestId('input-name'), 'value', '', 3)
    }
}
