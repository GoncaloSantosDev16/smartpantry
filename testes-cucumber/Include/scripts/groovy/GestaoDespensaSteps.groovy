import io.cucumber.java.en.Given
import io.cucumber.java.en.When
import io.cucumber.java.en.Then
import io.cucumber.java.en.And
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.webui.driver.DriverFactory
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

/**
 * US-03 / US-04 — Gestão da despensa (adicionar, validar, editar, cancelar, remover).
 *
 * Os elementos são localizados pelos data-testid da HomeView. As classes CSS antigas
 * (item-name, error-text, qty-badge, edit, delete) desapareceram com a migração para
 * Tailwind e a categoria passou de <select> para <input> com sugestões (datalist).
 */
class GestaoDespensaSteps {

	TestObject criarObjeto(String xpath) {
		TestObject to = new TestObject(xpath)
		to.addProperty("xpath", ConditionType.EQUALS, xpath)
		return to
	}

	TestObject porTestId(String testId) {
		return criarObjeto("//*[@data-testid='" + testId + "']")
	}

	TestObject nomeNaLista(String nome) {
		return criarObjeto("//*[@data-testid='pantry-item-name' and normalize-space(.)='" + nome + "']")
	}

	TestObject acaoDoItem(String nome, String testId) {
		return criarObjeto("//li[@data-testid='pantry-item' and @data-name='" + nome + "']//*[@data-testid='" + testId + "']")
	}

	// ==========================================
	// CONTEXTO GLOBAL E ACESSO
	// ==========================================
	@Given("que acedo à página principal da aplicação")
	def acederPaginaPrincipal() {
		// O Hooks.groovy (smartpantry.steps) pode já ter aberto o browser
		try {
			DriverFactory.getWebDriver()
		} catch (Exception semBrowser) {
			WebUI.openBrowser('')
		}
		WebUI.navigateToUrl('http://localhost:5173')
		WebUI.waitForPageLoad(10)

		// Primeiro arranque: conclui o onboarding com os valores por defeito
		if (WebUI.waitForElementPresent(porTestId('onboarding-next'), 3, FailureHandling.OPTIONAL)) {
			while (WebUI.waitForElementPresent(porTestId('onboarding-next'), 1, FailureHandling.OPTIONAL)) {
				WebUI.click(porTestId('onboarding-next'))
			}
			WebUI.click(porTestId('onboarding-finish'))
		}

		WebUI.waitForElementVisible(porTestId('input-name'), 10)
	}

	@Given("a despensa tem pelo menos o item {string} adicionado")
	def garantirItemNaDespensa(String nomeItem) {
		if (!WebUI.waitForElementPresent(nomeNaLista(nomeItem), 2, FailureHandling.OPTIONAL)) {
			WebUI.setText(porTestId('input-name'), nomeItem)
			WebUI.click(porTestId('btn-add-item'))
			WebUI.waitForElementPresent(nomeNaLista(nomeItem), 5)
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
		TestObject inputNome = porTestId('input-name')
		WebUI.waitForElementVisible(inputNome, 5)
		WebUI.setText(inputNome, texto)
	}

	@When("seleciono a categoria {string}")
	def selecionarCategoria(String categoria) {
		// A categoria é um campo de texto com sugestões (pode ser escolhida ou escrita)
		WebUI.setText(porTestId('input-category'), categoria)
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
		WebUI.setText(porTestId('input-quantity'), qtd)
	}

	@When("tento submeter o formulário com o campo {string} vazio")
	def submeterFormularioVazio(String campo) {
		TestObject inputNome = porTestId('input-name')
		WebUI.waitForElementVisible(inputNome, 5)
		WebUI.setText(inputNome, '')
	}

	@When("clico no botão {string}")
	def clicarBotaoDinamico(String botao) {
		// "Adicionar Item" e "Guardar" são o mesmo botão de submissão (muda de texto ao editar)
		Map<String, String> porNome = [
			'Adicionar Item': 'btn-add-item',
			'Adicionar'     : 'btn-add-item',
			'Guardar'       : 'btn-add-item',
			'Cancelar'      : 'btn-cancel-edit',
		]
		TestObject btn = porNome.containsKey(botao)
			? porTestId(porNome[botao])
			: criarObjeto("//button[contains(normalize-space(.), '" + botao + "')]")
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
		WebUI.verifyElementVisible(nomeNaLista(prod))
	}

	@Then("o sistema deve apresentar uma mensagem de erro indicando que o nome é obrigatório")
	def verificarMensagemErro() {
		TestObject msgErro = criarObjeto("//*[@data-testid='error-name' and contains(., 'obrigatório')]")
		WebUI.waitForElementVisible(msgErro, 5)
	}

	@Then("o formulário deve voltar ao modo de criação {string}")
	def verificarModoFormularioCriacao(String tituloEsperado) {
		logicaVerificarTituloForm(tituloEsperado)
	}

	@Then("o formulário deve ser limpo e voltar ao modo {string}")
	def verificarModoFormularioLimpo(String tituloEsperado) {
		logicaVerificarTituloForm(tituloEsperado)
		WebUI.verifyElementAttributeValue(porTestId('input-name'), 'value', '', 3)
		WebUI.verifyElementNotPresent(porTestId('btn-cancel-edit'), 3)
	}

	def logicaVerificarTituloForm(String titulo) {
		TestObject tituloForm = criarObjeto("//*[@data-testid='form-title' and contains(normalize-space(.), '" + titulo + "')]")
		WebUI.verifyElementPresent(tituloForm, 3)
	}

	@And("o item {string} deve aparecer na lista da despensa com a quantidade {string}")
	def verificarProdutoComQuantidade(String produto, String qtd) {
		logicaVerificarProdutoVisivel(produto)
		TestObject qtdBadge = criarObjeto("//li[@data-testid='pantry-item' and @data-name='" + produto + "']//*[@data-testid='pantry-item-qty' and contains(normalize-space(.), '" + qtd + "')]")
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
		WebUI.verifyElementNotPresent(nomeNaLista(n), 3)
	}

	// ==========================================
	// AÇÕES DE EDIÇÃO E REMOÇÃO (US-04)
	// ==========================================
	@When("o utilizador clica no botão de editar do item {string}")
	def clicarEditar(String nomeItem) {
		WebUI.click(acaoDoItem(nomeItem, 'btn-edit-item'))
		WebUI.waitForElementPresent(porTestId('btn-cancel-edit'), 3)
	}

	@When("o utilizador clica no botão de remover do item {string}")
	def clicarRemover(String nomeItem) {
		WebUI.click(acaoDoItem(nomeItem, 'btn-remove-item'))
	}
}
