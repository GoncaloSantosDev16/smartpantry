package smartpantry.steps

import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * US-15 (SCRUM-43) — Step definitions for TimesCooked.feature.
 *
 * Reused steps:
 *   OnboardingSteps                 -> "I have completed the onboarding"
 *   RecipeCoverageSteps             -> "the pantry contains:"
 *   RecipeSaveSteps                 -> "I open a generated recipe", "I save the recipe",
 *                                      "the recipe is marked as saved"
 *   ConsumedIngredientsSummarySteps -> "I finish cooking the recipe", "I confirm the summary" (US-21)
 *   SavedRecipesSteps               -> "I open the saved recipes screen", "I open the saved recipe ..."
 *   CookingCarouselSteps            -> "I start cooking", "I go to the next cooking step" (US-19)
 *
 * The counter is read from data-count (number) and from the visible text
 * ("Ainda não cozinhada", "Cozinhada 1 vez", "Cozinhada N vezes").
 * The browser is opened and closed by Hooks.groovy.
 */
public class TimesCookedSteps {

    // ------------------------------------------------------------- helpers

    private static String textoEsperado(int vezes) {
        if (vezes == 0) {
            return 'Ainda não cozinhada'
        }
        return 'Cozinhada ' + vezes + (vezes == 1 ? ' vez' : ' vezes')
    }

    /** Contador do cartão da receita na lista de receitas guardadas. */
    private static TestObject contadorDoCartao(String titulo) {
        String xpath = "//*[@data-testid='recipe-card'][.//*[@data-testid='recipe-card-title' and normalize-space(.)='" +
                titulo + "']]//*[@data-testid='recipe-card-times-cooked']"
        TestObject objeto = new TestObject(xpath)
        objeto.addProperty('xpath', ConditionType.EQUALS, xpath)
        return objeto
    }

    /** Confirma o número (data-count) e o texto de um contador. */
    private static void verificarContador(TestObject contador, int vezes) {
        WebUI.waitForElementPresent(contador, Suporte.ESPERA)
        WebUI.verifyElementAttributeValue(contador, 'data-count', String.valueOf(vezes), Suporte.ESPERA)
        String texto = WebUI.getText(contador)
        if (!texto.contains(textoEsperado(vezes))) {
            KeywordUtil.markFailed("The counter shows '" + texto + "' and should show '" + textoEsperado(vezes) + "'.")
        }
    }

    // ----------------------------------------------------------------- When

    @When("^I leave the summary without confirming\$")
    public void sairDoResumoSemConfirmar() {
        WebUI.waitForElementClickable(Suporte.porTestId('meal-summary-back'), Suporte.ESPERA)
        WebUI.click(Suporte.porTestId('meal-summary-back'))
        WebUI.waitForElementPresent(Suporte.porTestId('recipe-detail'), Suporte.ESPERA)
    }

    // ----------------------------------------------------------------- Then

    @Then("^the recipe shows it was never cooked\$")
    public void receitaNuncaCozinhada() {
        verificarContador(Suporte.porTestId('recipe-times-cooked'), 0)
    }

    @Then("^the recipe shows it was cooked (\\d+) times?\$")
    public void receitaCozinhada(int vezes) {
        verificarContador(Suporte.porTestId('recipe-times-cooked'), vezes)
    }

    @Then("^the saved recipe \"([^\"]*)\" shows it was never cooked\$")
    public void cartaoNuncaCozinhado(String titulo) {
        verificarContador(contadorDoCartao(titulo), 0)
    }

    @Then("^the saved recipe \"([^\"]*)\" shows it was cooked (\\d+) times?\$")
    public void cartaoCozinhado(String titulo, int vezes) {
        verificarContador(contadorDoCartao(titulo), vezes)
    }
}
