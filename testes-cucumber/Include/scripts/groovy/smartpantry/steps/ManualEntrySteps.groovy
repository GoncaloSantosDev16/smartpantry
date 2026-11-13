package smartpantry.steps

import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType
import io.cucumber.java.en.Given
import io.cucumber.java.en.When
import io.cucumber.java.en.Then

class ManualEntrySteps {

    private TestObject makeTO(String xpath) {
        TestObject to = new TestObject(xpath)
        to.addProperty("xpath", ConditionType.EQUALS, xpath)
        return to
    }

    @Given("the user is on the main Pantry page")
    def openApp() {
        WebUI.openBrowser('http://localhost:5173')
        WebUI.maximizeWindow()
        WebUI.waitForPageLoad(10)
    }

    @Given("selects the {string} tab")
    def selectTab(String tabName) {
        // Converte o nome da aba passado pelo Gherkin para o formato do nosso testid (ex: "Manual" -> "tab-manual")
        String testId = "tab-" + tabName.toLowerCase()
        
        TestObject tab = makeTO("//button[@data-testid='${testId}']")
        WebUI.waitForElementClickable(tab, 5)
        WebUI.click(tab)
    }

    @When("they fill the name with {string}")
    def fillName(String name) {
        TestObject inputName = makeTO("//input[@data-testid='input-name']")
        WebUI.waitForElementVisible(inputName, 5)
        WebUI.setText(inputName, name)
    }

    @When("select the category {string}")
    def selectCategory(String category) {
        WebUI.setText(makeTO("//input[@data-testid='input-category']"), category)
    }

    @When("set the quantity to {string} and the unit to {string}")
    def setQuantityAndUnit(String qty, String unit) {
        WebUI.setText(makeTO("//input[@data-testid='input-quantity']"), qty)
        WebUI.selectOptionByValue(makeTO("//select[@data-testid='select-unit']"), unit, false)
    }

    @When("click the {string} button")
    def clickButton(String btnText) {
        TestObject btnAdd = makeTO("//button[@data-testid='btn-add-item']")
        WebUI.waitForElementClickable(btnAdd, 5)
        WebUI.click(btnAdd)
    }

    @Then("the product {string} should appear in the pantry list")
    def verifyProductAdded(String productName) {
        // Procura um elemento com o testid da lista que contenha o nome do produto específico
        TestObject produtoNaLista = makeTO("//strong[@data-testid='pantry-item-name' and contains(text(), '${productName}')]")
        
        WebUI.waitForElementVisible(produtoNaLista, 5)
        WebUI.verifyElementPresent(produtoNaLista, 5)
        
        WebUI.closeBrowser()
    }
}