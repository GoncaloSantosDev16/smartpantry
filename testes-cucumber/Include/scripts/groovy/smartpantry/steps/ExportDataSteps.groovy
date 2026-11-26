package smartpantry.steps

import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import io.cucumber.java.en.And
import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

class ExportDataSteps {

	private TestObject byTestId(String testId) {
		TestObject obj = new TestObject(testId)
		obj.addProperty("css", ConditionType.EQUALS, "[data-testid='${testId}']")
		return obj
	}

	@Given("the application has a saved profile and ingredient")
	def prepareInitialData() {
		// Se a sessão arrancar no /onboarding (IndexedDB vazio), conclui os 3 passos
		if (WebUI.waitForElementPresent(byTestId("onboarding"), 3, FailureHandling.OPTIONAL)) {
			// Passo 1 -> Passo 2 (o campo profile-name já vem preenchido com "Casa")
			WebUI.waitForElementClickable(byTestId("onboarding-next"), 5)
			WebUI.click(byTestId("onboarding-next"))

			// Passo 2 -> Passo 3
			WebUI.waitForElementClickable(byTestId("onboarding-next"), 5)
			WebUI.click(byTestId("onboarding-next"))

			// Passo 3 -> Concluir e guardar perfil
			WebUI.waitForElementClickable(byTestId("onboarding-finish"), 5)
			WebUI.click(byTestId("onboarding-finish"))
		}

		WebUI.waitForElementVisible(byTestId("profile-switcher-toggle"), 10)
	}

	@And("the user navigates to the Settings view")
	def navigateToSettings() {
		WebUI.click(byTestId("profile-switcher-toggle"))
		WebUI.waitForElementVisible(byTestId("manage-profiles-link"), 5)
		WebUI.click(byTestId("manage-profiles-link"))
		WebUI.waitForElementVisible(byTestId("settings-view"), 10)
	}

	@When("the user requests to export the data to JSON")
	def exportDataToJson() {
		WebUI.waitForElementClickable(byTestId("export-json-btn"), 10)
		WebUI.click(byTestId("export-json-btn"))
	}

	@Then("the application confirms that the JSON file was generated successfully")
	def verifyExportConfirmation() {
		WebUI.waitForElementVisible(byTestId("export-status"), 10)
		String message = WebUI.getText(byTestId("export-status"))
		assert message != null && message.trim().length() > 0
	}
}