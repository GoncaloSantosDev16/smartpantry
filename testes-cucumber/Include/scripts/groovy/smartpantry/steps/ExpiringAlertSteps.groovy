package smartpantry.steps

import java.time.LocalDate

import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-108 — Step definitions da US-06 (alerta de itens a expirar em 48h).
 *
 * O produto é adicionado pelo formulário do ecrã de início, como faria o
 * utilizador. O browser é aberto e fechado pelo Hooks.groovy; o passo
 * "I reload the app" vem do ShoppingListSteps.
 */
public class ExpiringAlertSteps {

    private static TestObject itemDaDespensa(String nome) {
        return Suporte.porCss("[data-testid='pantry-item'][data-name='" + nome + "']")
    }

    private static TestObject itemDoAlerta(String nome) {
        return Suporte.porCss("[data-testid='expiring-alert'] [data-testid='expiring-item'][data-name='" + nome + "']")
    }

    // ----------------------------------------------------------------- When

    @When("^I add the product \"([^\"]*)\" expiring in (\\d+) days?\$")
    public void adicionarProduto(String nome, int dias) {
        WebUI.waitForElementPresent(Suporte.porTestId('input-name'), Suporte.ESPERA)

        // input type="date" recebe sempre AAAA-MM-DD, independentemente da língua do browser
        String validade = LocalDate.now().plusDays(dias).toString()

        Suporte.escreverCampo('input-name', nome)
        Suporte.escreverCampo('item-expiration', validade)
        WebUI.click(Suporte.porTestId('btn-add-item'))

        WebUI.waitForElementPresent(itemDaDespensa(nome), Suporte.ESPERA)
    }

    @When("^I remove the product \"([^\"]*)\" from the pantry\$")
    public void removerProduto(String nome) {
        WebUI.click(Suporte.porCss("[data-testid='pantry-item'][data-name='" + nome + "'] [data-testid='btn-remove-item']"))
        WebUI.waitForElementNotPresent(itemDaDespensa(nome), Suporte.ESPERA)
    }

    // ----------------------------------------------------------------- Then

    @Then("^I see the expiring items alert\$")
    public void vejoAlerta() {
        WebUI.verifyElementVisible(Suporte.porTestId('expiring-alert'))
    }

    @Then("^I do not see the expiring items alert\$")
    public void naoVejoAlerta() {
        WebUI.verifyElementNotPresent(Suporte.porTestId('expiring-alert'), 2)
    }

    @Then("^the expiring items alert lists \"([^\"]*)\"\$")
    public void alertaMostraProduto(String nome) {
        WebUI.waitForElementVisible(Suporte.porTestId('expiring-alert'), Suporte.ESPERA)
        WebUI.verifyElementVisible(itemDoAlerta(nome))
    }

    @Then("^the product \"([^\"]*)\" is highlighted in the pantry\$")
    public void produtoDestacado(String nome) {
        WebUI.verifyElementAttributeValue(itemDaDespensa(nome), 'data-expiring', 'true', Suporte.ESPERA)
    }

    @Then("^the product \"([^\"]*)\" is not highlighted in the pantry\$")
    public void produtoNaoDestacado(String nome) {
        WebUI.verifyElementAttributeValue(itemDaDespensa(nome), 'data-expiring', 'false', Suporte.ESPERA)
    }
}
