package smartpantry.steps

import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.After
import io.cucumber.java.Scenario
import io.cucumber.java.en.Given
import io.cucumber.java.en.When
import io.cucumber.java.en.Then

class ManualEntrySteps {

	// Se o Vite mudar de porta, o teste vê outra página. Arranca a app com:
	// npm run dev -- --port 5173 --strictPort
	private static final String BASE_URL = 'http://localhost:5173'

	private TestObject makeTO(String xpath) {
		TestObject to = new TestObject(xpath)
		to.addProperty('xpath', ConditionType.EQUALS, xpath)
		return to
	}

	private TestObject byTestId(String id) {
		return makeTO("//*[@data-testid='" + id + "']")
	}

	@Given("the user is on the main Pantry page")
	def openApp() {
		WebUI.openBrowser('')
		WebUI.maximizeWindow()
		WebUI.navigateToUrl(BASE_URL)
		WebUI.waitForPageLoad(10)

		// Browser novo = base de dados vazia, por isso a app mostra o onboarding.
		// Se aparecer, passa os 3 passos com os valores por defeito.
		if (WebUI.waitForElementPresent(byTestId('onboarding'), 5, FailureHandling.OPTIONAL)) {
			WebUI.click(byTestId('onboarding-next'))
			WebUI.click(byTestId('onboarding-next'))
			WebUI.click(byTestId('onboarding-finish'))
		}

		WebUI.waitForElementPresent(byTestId('home'), 10)
	}

	@Given("selects the {string} tab")
	def selectTab(String tabName) {
		// "Manual" -> tab-manual. Aceita também os nomes que aparecem no ecrã.
		def ids = [
			'manual': 'tab-manual',
			'camera': 'tab-camera',
			'câmara': 'tab-camera',
			'upload': 'tab-upload',
			'imagem': 'tab-upload'
		]
		String testId = ids[tabName.toLowerCase()] ?: ('tab-' + tabName.toLowerCase())

		TestObject tab = byTestId(testId)
		WebUI.waitForElementClickable(tab, 5)
		WebUI.click(tab)
	}

	@When("they fill the name with {string}")
	def fillName(String name) {
		TestObject inputName = byTestId('input-name')
		WebUI.waitForElementVisible(inputName, 5)
		WebUI.setText(inputName, name)
	}

	@When("select the category {string}")
	def selectCategory(String category) {
		WebUI.setText(byTestId('input-category'), category)
	}

	@When("set the quantity to {string} and the unit to {string}")
	def setQuantityAndUnit(String qty, String unit) {
		WebUI.setText(byTestId('input-quantity'), qty)
		WebUI.selectOptionByValue(byTestId('select-unit'), unit, false)
	}

	@When("click the {string} button")
	def clickButton(String btnText) {
		// Só existe um botão de submeter no formulário
		TestObject btnAdd = byTestId('btn-add-item')
		WebUI.waitForElementClickable(btnAdd, 5)
		WebUI.click(btnAdd)
	}

	@Then("the product {string} should appear in the pantry list")
	def verifyProductAdded(String productName) {
		TestObject produtoNaLista = makeTO("//strong[@data-testid='pantry-item-name' and contains(normalize-space(.), '" + productName + "')]")
		WebUI.waitForElementVisible(produtoNaLista, 5)
		WebUI.verifyElementPresent(produtoNaLista, 5)
	}

	// Corre sempre no fim de cada cenário, passe ou falhe
	@After
	void closeApp(Scenario scenario) {
		if (scenario.isFailed()) {
		WebUI.takeScreenshot(FailureHandling.OPTIONAL)
		}
	WebUI.closeBrowser(FailureHandling.OPTIONAL)
}
}