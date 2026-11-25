package smartpantry.steps

import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * SCRUM-143 — Step definitions for CookingCarousel.feature (US-19, SCRUM-47).
 *
 * Reused steps:
 *   OnboardingSteps                 -> "I have completed the onboarding"
 *   RecipeSaveSteps                 -> "I open a generated recipe", "I save the recipe",
 *                                      "the recipe is marked as saved", "I see the recipe details"
 *   ConsumedIngredientsSummarySteps -> "I finish cooking the recipe" (clicks finish-recipe),
 *                                      "I see the summary of the ingredients used" (US-21)
 *
 * Elements are located through the data-testid attributes of CookingCarousel.vue.
 * The browser is opened and closed by Hooks.groovy.
 */
public class CookingCarouselSteps {

    private static final String CARROSSEL = 'cooking-carousel'

    // ------------------------------------------------------------- helpers

    private static TestObject carrossel() {
        return Suporte.porTestId(CARROSSEL)
    }

    /** Número do passo que o carrossel está a mostrar (atributo data-step). */
    private static int passoAtual() {
        WebUI.waitForElementPresent(carrossel(), Suporte.ESPERA)
        return Integer.parseInt(WebUI.getAttribute(carrossel(), 'data-step'))
    }

    /** Espera até o carrossel mostrar o passo indicado. */
    private static void esperarPasso(int passo) {
        WebUI.verifyElementAttributeValue(carrossel(), 'data-step', String.valueOf(passo), Suporte.ESPERA)
    }

    /**
     * Simula um gesto de deslizar na zona do passo. O Chrome do Katalon não tem
     * ecrã tátil, por isso disparam-se os eventos de ponteiro que o componente ouve.
     */
    private static void deslizar(int distancia) {
        WebUI.executeJavaScript('''
            var zona = document.querySelector("[data-testid='cooking-step']")
            var inicio = 300
            zona.dispatchEvent(new PointerEvent('pointerdown', { clientX: inicio, bubbles: true }))
            zona.dispatchEvent(new PointerEvent('pointerup', { clientX: inicio + arguments[0], bubbles: true }))
        ''', [distancia])
    }

    /** Nomes (data-name) dos ingredientes do passo atual, pela ordem do ecrã. */
    private static List<String> ingredientesDoPasso() {
        Object nomes = WebUI.executeJavaScript('''
            var itens = document.querySelectorAll("[data-testid='cooking-step-ingredient']")
            return Array.prototype.map.call(itens, function (i) { return i.getAttribute('data-name') })
        ''', null)
        return (nomes as List).collect { String.valueOf(it) }
    }

    // ----------------------------------------------------------------- When

    @When("^I start cooking\$")
    public void comecarACozinhar() {
        WebUI.waitForElementClickable(Suporte.porTestId('start-cooking'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('start-cooking'))
        WebUI.waitForElementPresent(carrossel(), Suporte.ESPERA)
    }

    @When("^I go to the next cooking step\$")
    public void passoSeguinte() {
        int passo = passoAtual()
        WebUI.click(Suporte.porTestId('cooking-next'))
        esperarPasso(passo + 1)
    }

    @When("^I go back to the previous cooking step\$")
    public void passoAnterior() {
        int passo = passoAtual()
        WebUI.click(Suporte.porTestId('cooking-previous'))
        esperarPasso(passo - 1)
    }

    @When("^I swipe to the next cooking step\$")
    public void deslizarParaSeguinte() {
        int passo = passoAtual()
        deslizar(-150)
        esperarPasso(passo + 1)
    }

    @When("^I swipe to the previous cooking step\$")
    public void deslizarParaAnterior() {
        int passo = passoAtual()
        deslizar(150)
        esperarPasso(passo - 1)
    }

    @When("^I leave the cooking carousel\$")
    public void sairDoCarrossel() {
        WebUI.click(Suporte.porTestId('cooking-close'))
    }

    // ----------------------------------------------------------------- Then

    @Then("^I see cooking step (\\d+) of (\\d+)\$")
    public void vejoPasso(int passo, int total) {
        esperarPasso(passo)
        WebUI.verifyElementAttributeValue(carrossel(), 'data-total', String.valueOf(total), Suporte.ESPERA)
        WebUI.verifyElementText(Suporte.porTestId('cooking-step-counter'), 'Passo ' + passo + ' de ' + total)
    }

    @Then("^the cooking step says \"([^\"]*)\"\$")
    public void passoDiz(String texto) {
        WebUI.verifyElementText(Suporte.porTestId('cooking-step-text'), texto)
    }

    @Then("^the cooking step ingredients are \"([^\"]*)\"\$")
    public void ingredientesDoPassoSao(String esperados) {
        List<String> lista = esperados.split(',').collect { it.trim() }.findAll { it }
        List<String> noEcra = ingredientesDoPasso()
        if (noEcra != lista) {
            KeywordUtil.markFailed('The cooking step shows ' + noEcra + ' but it should show ' + lista + '.')
        }
    }

    @Then("^the cooking step has no timer\$")
    public void passoSemTemporizador() {
        WebUI.verifyElementNotPresent(Suporte.porTestId('cooking-step-timer'), 1)
    }

    @Then("^the cooking step timer shows \"([^\"]*)\"\$")
    public void temporizadorMostra(String tempo) {
        WebUI.waitForElementPresent(Suporte.porTestId('cooking-step-timer'), Suporte.ESPERA)
        String texto = WebUI.getText(Suporte.porTestId('cooking-step-timer'))
        if (!texto.contains(tempo)) {
            KeywordUtil.markFailed("The timer shows '" + texto + "' and should show '" + tempo + "'.")
        }
    }

    @Then("^I cannot go back to a previous cooking step\$")
    public void naoPossoRecuar() {
        String desativado = WebUI.getAttribute(Suporte.porTestId('cooking-previous'), 'disabled')
        if (desativado == null) {
            KeywordUtil.markFailed('The "Anterior" button should be disabled on the first step.')
        }
    }

    @Then("^the last cooking step offers to finish the recipe\$")
    public void ultimoPassoOfereceConcluir() {
        TestObject concluir = Suporte.porCss("[data-testid='" + CARROSSEL + "'] [data-testid='finish-recipe']")
        WebUI.verifyElementVisible(concluir)
        String texto = WebUI.getText(concluir)
        if (!texto.contains('Concluir')) {
            KeywordUtil.markFailed("The last step button says '" + texto + "' and should say 'Concluir'.")
        }
        WebUI.verifyElementNotPresent(Suporte.porTestId('cooking-next'), 1)
    }

    @Then("^the cooking carousel is closed\$")
    public void carrosselFechado() {
        WebUI.verifyElementNotPresent(carrossel(), Suporte.ESPERA)
    }
}