package smartpantry.steps

import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Given
import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-112 — Step definitions da lista de compras (US-24 / SCRUM-52).
 *
 * O browser é aberto e fechado pelo Hooks.groovy.
 */
public class ShoppingListSteps {

    // ------------------------------------------------------------- helpers

    private static TestObject item(String nome) {
        return Suporte.porCss("li[data-testid='shopping-item'][data-name='" + nome + "']")
    }

    private static TestObject acaoDoItem(String nome, String testId) {
        return Suporte.porCss("li[data-testid='shopping-item'][data-name='" + nome + "'] [data-testid='" + testId + "']")
    }

    private static void abrirLista() {
        if (!WebUI.waitForElementPresent(Suporte.porTestId('shopping-list-drawer'), 1)) {
            WebUI.click(Suporte.porTestId('shopping-list-button'))
        }
        WebUI.waitForElementVisible(Suporte.porTestId('shopping-list-drawer'), Suporte.ESPERA)
    }

    private static void adicionar(String nome, String quantidade) {
        Suporte.escreverCampo('shopping-item-name', nome)
        Suporte.escreverCampo('shopping-item-qty', quantidade)
        WebUI.click(Suporte.porTestId('shopping-item-add'))
    }

    /** Esvazia a tabela shoppingItems (mesma técnica do Suporte.limparPerfis). */
    private static void limparListaCompras() {
        WebUI.executeJavaScript('''
            window.__listaLimpa = false
            var pedido = indexedDB.open('smartpantry')
            pedido.onsuccess = function (evento) {
                var bd = evento.target.result
                if (!bd.objectStoreNames.contains('shoppingItems')) {
                    bd.close(); window.__listaLimpa = true; return
                }
                var transacao = bd.transaction('shoppingItems', 'readwrite')
                transacao.objectStore('shoppingItems').clear()
                transacao.oncomplete = function () { bd.close(); window.__listaLimpa = true }
                transacao.onerror = function () { bd.close(); window.__listaLimpa = true }
            }
            pedido.onerror = function () { window.__listaLimpa = true }
        ''', null)

        for (int tentativa = 0; tentativa < 10; tentativa++) {
            if (WebUI.executeJavaScript('return window.__listaLimpa === true', null)) {
                return
            }
            WebUI.delay(1)
        }
    }

    // ---------------------------------------------------------------- Given

    @Given("^I am on the dashboard with an empty shopping list\$")
    public void dashboardComListaVazia() {
        WebUI.navigateToUrl(Suporte.BASE_URL)
        WebUI.waitForPageLoad(Suporte.ESPERA)
        Suporte.limparPerfis()
        limparListaCompras()
        Suporte.completarOnboarding()
        WebUI.waitForElementVisible(Suporte.porTestId('shopping-list-button'), Suporte.ESPERA)
    }

    @Given("^the shopping list has the item \"([^\"]*)\"\$")
    public void listaTemItem(String nome) {
        abrirLista()
        adicionar(nome, '1')
        WebUI.verifyElementPresent(item(nome), Suporte.ESPERA)
    }

    // ----------------------------------------------------------------- When

    @When("^I open the shopping list from the header\$")
    public void abrirListaPeloCabecalho() {
        abrirLista()
    }

    @When("^I add \"([^\"]*)\" with quantity (\\d+) to the shopping list\$")
    public void adicionarItem(String nome, int quantidade) {
        adicionar(nome, String.valueOf(quantidade))
    }

    @When("^I try to add an item without a name\$")
    public void adicionarSemNome() {
        Suporte.escreverCampo('shopping-item-name', '')
        WebUI.click(Suporte.porTestId('shopping-item-add'))
    }

    @When("^I remove \"([^\"]*)\" from the shopping list\$")
    public void removerItem(String nome) {
        WebUI.click(acaoDoItem(nome, 'shopping-item-remove'))
    }

    @When("^I mark \"([^\"]*)\" as bought\$")
    public void marcarComprado(String nome) {
        WebUI.click(acaoDoItem(nome, 'shopping-item-toggle'))
    }

    @When("^I reload the app\$")
    public void recarregar() {
        WebUI.refresh()
        WebUI.waitForPageLoad(Suporte.ESPERA)
        WebUI.waitForElementVisible(Suporte.porTestId('shopping-list-button'), Suporte.ESPERA)
    }

    // ----------------------------------------------------------------- Then

    @Then("^I see \"([^\"]*)\" in the shopping list\$")
    public void vejoItem(String nome) {
        WebUI.verifyElementPresent(item(nome), Suporte.ESPERA)
    }

    @Then("^I do not see \"([^\"]*)\" in the shopping list\$")
    public void naoVejoItem(String nome) {
        WebUI.verifyElementNotPresent(item(nome), Suporte.ESPERA)
    }

    @Then("^the item \"([^\"]*)\" is shown as bought\$")
    public void itemComprado(String nome) {
        WebUI.verifyElementAttributeValue(item(nome), 'data-checked', 'true', Suporte.ESPERA)
    }

    @Then("^the header counter shows (\\d+)\$")
    public void contadorMostra(int n) {
        WebUI.verifyElementText(Suporte.porTestId('shopping-list-badge'), String.valueOf(n))
    }

    @Then("^the header counter is hidden\$")
    public void contadorEscondido() {
        WebUI.verifyElementNotPresent(Suporte.porTestId('shopping-list-badge'), Suporte.ESPERA)
    }

    @Then("^the shopping list is empty\$")
    public void listaVazia() {
        WebUI.verifyElementPresent(Suporte.porTestId('shopping-list-empty'), Suporte.ESPERA)
    }

    @Then("^I see an error in the shopping list\$")
    public void vejoErro() {
        WebUI.verifyElementVisible(Suporte.porTestId('shopping-item-error'))
    }
}
