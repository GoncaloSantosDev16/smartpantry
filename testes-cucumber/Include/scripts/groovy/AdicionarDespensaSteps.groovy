import io.cucumber.java.en.Given
import io.cucumber.java.en.When
import io.cucumber.java.en.Then
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

class AdicionarDespensaSteps {


	TestObject criarObjeto(String xpath) {
		TestObject to = new TestObject()
		to.addProperty("xpath", ConditionType.EQUALS, xpath)
		return to
	}

	@Given("que acedo à página principal da aplicação")
	def acederPaginaPrincipal() {
		WebUI.openBrowser('')
		WebUI.navigateToUrl('http://localhost:5173')
		WebUI.waitForPageLoad(10)
		WebUI.delay(2) 
		

		TestObject btnContinuar = criarObjeto("//button[contains(text(), 'Continuar')]")
		TestObject btnConcluir = criarObjeto("//button[contains(text(), 'Concluir')]")

	
		if (WebUI.waitForElementVisible(btnContinuar, 3, FailureHandling.OPTIONAL)) {
			WebUI.click(btnContinuar)
			WebUI.delay(1)
			
			if (WebUI.waitForElementVisible(btnContinuar, 2, FailureHandling.OPTIONAL)) {
				WebUI.click(btnContinuar)
				WebUI.delay(1)
			}
			
			if (WebUI.waitForElementVisible(btnConcluir, 2, FailureHandling.OPTIONAL)) {
				WebUI.click(btnConcluir)
			}
		}
		
		WebUI.waitForElementVisible(criarObjeto("//h1[contains(text(), 'SmartPantry')]"), 5)
	}

	@When("preencho o campo {string} com {string}")
	def preencherCampoProduto(String campo, String valor) {
		
		TestObject inputNome = criarObjeto("//input[@placeholder='Ex: Arroz agulha...']")
		WebUI.waitForElementVisible(inputNome, 5)
		WebUI.setText(inputNome, valor)
	}

	@When("seleciono a categoria {string}")
	def selecionarCategoria(String categoria) {
		
		TestObject selectCategoria = criarObjeto("//label[text()='Categoria']/following-sibling::select")
		WebUI.selectOptionByLabel(selectCategoria, categoria, false)
	}

	@When("insiro a quantidade {string}")
	def inserirQuantidade(String quantidade) {
	
		TestObject inputQt = criarObjeto("//input[@type='number']")
		WebUI.clearText(inputQt)
		WebUI.setText(inputQt, quantidade)
	}

	@When("tento submeter o formulário com o campo {string} vazio")
	def submeterFormularioVazio(String campo) {
		TestObject inputNome = criarObjeto("//input[@placeholder='Ex: Arroz agulha...']")
		WebUI.waitForElementVisible(inputNome, 5)
		
		WebUI.sendKeys(inputNome, '\u0008\u0008\u0008\u0008\u0008\u0008\u0008\u0008\u0008\u0008')
		WebUI.clearText(inputNome)
	}

	@When("clico no botão {string}")
	def clicarBotaoAdicionar(String botao) {
	
		TestObject btnAdicionar = criarObjeto("//button[contains(@class, 'btn-primary') and text()='Adicionar Item']")
		WebUI.click(btnAdicionar)
	}

	@Then("o produto {string} deve aparecer listado na despensa")
	def verificarProdutoListado(String produto) {
	
		TestObject itemAdicionado = criarObjeto("//strong[contains(@class, 'item-name') and text()='" + produto + "']")
		WebUI.waitForElementVisible(itemAdicionado, 5)
		WebUI.verifyElementPresent(itemAdicionado, 5)
		WebUI.closeBrowser()
	}

	@Then("o sistema deve apresentar uma mensagem de erro indicando que o nome é obrigatório")
	def verificarMensagemErro() {
	
		TestObject msgErro = criarObjeto("//span[contains(@class, 'error-text') and contains(text(), 'O nome é obrigatório')]")
		WebUI.waitForElementVisible(msgErro, 5)
		WebUI.verifyElementPresent(msgErro, 5)
		WebUI.closeBrowser()
	}
}