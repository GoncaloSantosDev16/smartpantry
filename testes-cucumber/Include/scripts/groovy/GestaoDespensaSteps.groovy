import io.cucumber.java.en.Given
import io.cucumber.java.en.When
import io.cucumber.java.en.Then
import io.cucumber.java.en.And
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

class GestaoDespensaSteps {

	TestObject criarObjeto(String xpath) {
		TestObject to = new TestObject()
		to.addProperty("xpath", ConditionType.EQUALS, xpath)
		return to
	}

	// ==========================================
	// CONTEXTO GLOBAL E ACESSO
	// ==========================================
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

	@Given("a despensa tem pelo menos o item {string} adicionado")
	def garantirItemNaDespensa(String nomeItem) {
		TestObject item = criarObjeto("//strong[text()='" + nomeItem + "']")
		
		if (!WebUI.verifyElementPresent(item, 2, FailureHandling.OPTIONAL)) {
			TestObject inputNome = criarObjeto("//input[@placeholder='Ex: Arroz agulha...']")
			TestObject btnAdicionar = criarObjeto("//button[contains(text(), 'Adicionar')]")
			
			WebUI.setText(inputNome, nomeItem)
			WebUI.click(btnAdicionar)
			WebUI.delay(1)
		}
	}

	// ==========================================
	// PREENCHIMENTO DE CAMPOS
	// ==========================================
	@When("preencho o campo {string} com {string}")
	def preencherCampoProduto(String campo, String valor) {
		logicaPreencherNome(valor)
	}

	@When("altera o nome do produto para {string}")
	def alterarNomeProduto(String novoNome) {
		logicaPreencherNome(novoNome)
	}

	def logicaPreencherNome(String texto) {
		TestObject inputNome = criarObjeto("//input[@placeholder='Ex: Arroz agulha...']")
		WebUI.waitForElementVisible(inputNome, 5)
		WebUI.clearText(inputNome)
		WebUI.setText(inputNome, texto)
	}

	@When("seleciono a categoria {string}")
	def selecionarCategoria(String categoria) {
		TestObject selectCategoria = criarObjeto("//label[text()='Categoria']/following-sibling::select")
		WebUI.selectOptionByLabel(selectCategoria, categoria, false)
	}

	@When("insiro a quantidade {string}")
	def inserirQuantidade(String quantidade) {
		logicaInserirQuantidade(quantidade)
	}

	@When("altera a quantidade para {string}")
	def alterarQuantidade(String novaQuantidade) {
		logicaInserirQuantidade(novaQuantidade)
	}

	def logicaInserirQuantidade(String qtd) {
		TestObject inputQt = criarObjeto("//input[@type='number']")
		WebUI.clearText(inputQt)
		WebUI.setText(inputQt, qtd)
	}

	@When("tento submeter o formulário com o campo {string} vazio")
	def submeterFormularioVazio(String campo) {
		TestObject inputNome = criarObjeto("//input[@placeholder='Ex: Arroz agulha...']")
		WebUI.waitForElementVisible(inputNome, 5)
		WebUI.sendKeys(inputNome, '\u0008\u0008\u0008\u0008\u0008\u0008\u0008\u0008\u0008\u0008')
		WebUI.clearText(inputNome)
	}

	@When("clico no botão {string}")
	def clicarBotaoDinamico(String botao) {
		String textoNoEcra = botao == "Adicionar Item" ? "Adicionar" : botao
		
		TestObject btn = criarObjeto("//button[contains(text(), '" + textoNoEcra + "')]")
		WebUI.click(btn)
		WebUI.delay(1)
	}

	// ==========================================
	// VALIDAÇÕES
	// ==========================================
	@Then("o produto {string} deve aparecer listado na despensa")
	def verificarProdutoListado(String produto) {
		logicaVerificarProdutoVisivel(produto)
	}

	@Then("o item {string} deve permanecer inalterado na lista")
	def verificarProdutoInalterado(String produto) {
		logicaVerificarProdutoVisivel(produto)
	}

	@Then("o item {string} deve continuar visível na lista")
	def verificarProdutoVisivel(String produto) {
		logicaVerificarProdutoVisivel(produto)
	}

	def logicaVerificarProdutoVisivel(String prod) {
		TestObject itemAdicionado = criarObjeto("//strong[contains(@class, 'item-name') and text()='" + prod + "']")
		WebUI.waitForElementVisible(itemAdicionado, 5)
		WebUI.verifyElementPresent(itemAdicionado, 5)
	}

	@Then("o sistema deve apresentar uma mensagem de erro indicando que o nome é obrigatório")
	def verificarMensagemErro() {
		TestObject msgErro = criarObjeto("//span[contains(@class, 'error-text') and contains(text(), 'obrigatório')]")
		WebUI.waitForElementVisible(msgErro, 5)
		WebUI.verifyElementPresent(msgErro, 5)
	}

	@Then("o formulário deve voltar ao modo de criação {string}")
	def verificarModoFormularioCriacao(String tituloEsperado) {
		logicaVerificarTituloForm(tituloEsperado)
	}

	@Then("o formulário deve ser limpo e voltar ao modo {string}")
	def verificarModoFormularioLimpo(String tituloEsperado) {
		logicaVerificarTituloForm(tituloEsperado)
	}

	def logicaVerificarTituloForm(String titulo) {
		TestObject tituloForm = criarObjeto("//h2[contains(text(), '" + titulo + "')]")
		WebUI.verifyElementPresent(tituloForm, 3)
	}

	@And("o item {string} deve aparecer na lista da despensa com a quantidade {string}")
	def verificarProdutoComQuantidade(String produto, String qtd) {
		logicaVerificarProdutoVisivel(produto)
		TestObject qtdBadge = criarObjeto("//strong[text()='" + produto + "']/ancestor::li//span[contains(@class, 'qty-badge') and contains(text(), '" + qtd + "')]")
		WebUI.verifyElementPresent(qtdBadge, 3)
	}

	@And("o item {string} já não deve estar na lista")
	def verificarItemNaoEstaNaLista(String nome) {
		logicaVerificarItemRemovido(nome)
	}

	@Then("o item {string} deve desaparecer da lista da despensa")
	def verificarItemDesapareceu(String nome) {
		logicaVerificarItemRemovido(nome)
	}

	def logicaVerificarItemRemovido(String n) {
		TestObject item = criarObjeto("//strong[text()='" + n + "']")
		WebUI.verifyElementNotPresent(item, 2)
	}

	// ==========================================
	// AÇÕES DE EDIÇÃO E REMOÇÃO (US-04)
	// ==========================================
	@When("o utilizador clica no botão de editar do item {string}")
	def clicarEditar(String nomeItem) {
		String xpath = "//strong[text()='" + nomeItem + "']/ancestor::li//button[contains(@class, 'edit')]"
		TestObject btnEdit = criarObjeto(xpath)
		WebUI.click(btnEdit)
	}

	@When("o utilizador clica no botão de remover do item {string}")
	def clicarRemover(String nomeItem) {
		String xpath = "//strong[text()='" + nomeItem + "']/ancestor::li//button[contains(@class, 'delete')]"
		TestObject btnDelete = criarObjeto(xpath)
		WebUI.click(btnDelete)
	}


}