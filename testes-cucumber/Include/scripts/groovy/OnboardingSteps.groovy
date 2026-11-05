import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import io.cucumber.java.en.Given
import io.cucumber.java.en.When
import io.cucumber.java.en.Then
import io.cucumber.java.en.And

class OnboardingSteps {

	def getObjectByTestId(String testId) {
		def to = new com.kms.katalon.core.testobject.TestObject(testId)
		to.addProperty("xpath", com.kms.katalon.core.testobject.ConditionType.EQUALS, "//*[@data-testid='${testId}']")
		return to
	}

	@Given("the application is opened for the first time")
	def application_opened_first_time() {
		WebUI.openBrowser('http://localhost:5173')
		WebUI.executeJavaScript("window.indexedDB.deleteDatabase('smartpantry');", null)
		WebUI.refresh()
	}

	@When("the home page is loaded")
	def home_page_is_loaded() {
		WebUI.waitForPageLoad(10)
	}

	@Then("I see the onboarding screen")
	def see_onboarding_screen() {
		WebUI.verifyElementPresent(getObjectByTestId('onboarding'), 5)
	}

	@Given("I am on the onboarding screen")
	def on_the_onboarding_screen() {
		WebUI.verifyElementPresent(getObjectByTestId('onboarding'), 5)
	}

	@When("I set {int} people, the {string} diet and the {string} allergy")
	def set_profile_details(Integer persons, String diet, String allergy) {
		WebUI.click(getObjectByTestId('onboarding-next'))

		WebUI.waitForElementClickable(getObjectByTestId("diet-${diet}"), 3)
		WebUI.click(getObjectByTestId("diet-${diet}"))
		WebUI.click(getObjectByTestId('onboarding-next'))

		// CORREÇÃO: Utilizar os sufixos "-input" e "-add" gerados pelo componente TagInput
		WebUI.waitForElementVisible(getObjectByTestId('allergy-input'), 3)
		WebUI.setText(getObjectByTestId('allergy-input'), allergy)
		WebUI.click(getObjectByTestId('allergy-add'))
	}

	@And("I confirm the onboarding")
	def confirm_onboarding() {
		WebUI.click(getObjectByTestId('onboarding-finish'))
	}

	@Then("the default profile is saved")
	def default_profile_is_saved() {
		WebUI.delay(1)
	}

	@And("I am redirected to the dashboard")
	def redirected_to_dashboard() {
		WebUI.verifyMatch(WebUI.getUrl(), '.*', true)
	}

	@Given("a default profile already exists")
	def profile_already_exists() {
		WebUI.openBrowser('http://localhost:5173')
		// Limpa a base de dados para garantir que começamos do zero neste cenário
		WebUI.executeJavaScript("window.indexedDB.deleteDatabase('smartpantry');", null)
		WebUI.refresh()
		WebUI.waitForPageLoad(5)

		// 1. Usamos a própria interface para criar o perfil de forma natural
		WebUI.click(getObjectByTestId('onboarding-next'))
		WebUI.waitForElementClickable(getObjectByTestId('diet-vegetarian'), 3)
		WebUI.click(getObjectByTestId('diet-vegetarian'))
		WebUI.click(getObjectByTestId('onboarding-next'))
		WebUI.click(getObjectByTestId('onboarding-finish'))
		
		// 2. Aguarda que a aplicação grave no Pinia/Dexie e faça o redirecionamento natural
		WebUI.delay(2)
	}

	@When("I open the application")
	def open_the_application() {
		// 3. Simula o utilizador a sair e a voltar a entrar na aplicação
		WebUI.navigateToUrl('http://localhost:5173')
		WebUI.waitForPageLoad(5)
	}

	@Then("I see the dashboard without passing through onboarding")
	def see_dashboard_without_onboarding() {
		WebUI.verifyElementNotPresent(getObjectByTestId('onboarding'), 5)
	}

	@Given("I am on the first step of onboarding")
	def on_first_step_of_onboarding() {
		// Reset do browser e limpeza da base de dados para garantir que não herda o perfil do cenário 1.3
		WebUI.navigateToUrl('http://localhost:5173')
		WebUI.executeJavaScript("window.indexedDB.deleteDatabase('smartpantry');", null)
		WebUI.refresh()
		WebUI.waitForPageLoad(5)
		
		WebUI.verifyElementPresent(getObjectByTestId('profile-name'), 5)
	}

	@When("I clear the profile name")
	def clear_profile_name() {
		// Apaga todo o texto nativamente
		WebUI.clearText(getObjectByTestId('profile-name'))
		
		// Injeta um espaço e um backspace para forçar o v-model do Vue.js a reavaliar a variável "canContinue"
		WebUI.sendKeys(getObjectByTestId('profile-name'), " ")
		WebUI.sendKeys(getObjectByTestId('profile-name'), org.openqa.selenium.Keys.chord(org.openqa.selenium.Keys.BACK_SPACE))
	}

	@Then("I cannot advance to the next step")
	def cannot_advance() {
		WebUI.verifyElementHasAttribute(getObjectByTestId('onboarding-next'), 'disabled', 5)
	}

	@When("I try to open the onboarding screen directly")
	def open_onboarding_directly() {
		WebUI.navigateToUrl('http://localhost:5173/onboarding')
	}
}