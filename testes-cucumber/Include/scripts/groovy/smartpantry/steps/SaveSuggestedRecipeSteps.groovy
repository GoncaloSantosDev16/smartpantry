package smartpantry.steps

import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.en.Then
import io.cucumber.java.en.When

/**
 * Step definitions for SaveSuggestedRecipe.feature.
 *
 * Reutiliza os passos de RecipeSuggestionsSteps (despensa, API simulada, abrir e
 * pesquisar), de OnboardingSteps e de SavedRecipesSteps (ecrã das receitas guardadas).
 */
public class SaveSuggestedRecipeSteps {

    private static final String CARTAO = "[data-testid='recipe-card'][data-title='"

    @When("^I save the suggested recipe \"([^\"]*)\"\$")
    public void guardarSugestao(String titulo) {
        def botao = Suporte.porCss(CARTAO + titulo + "'] [data-testid='recipe-save']")
        WebUI.waitForElementClickable(botao, Suporte.ESPERA)
        WebUI.click(botao)
        // A gravação é assíncrona: espera pela marca "Guardada" antes de avançar.
        WebUI.waitForElementPresent(Suporte.porCss(CARTAO + titulo + "'] [data-testid='recipe-saved']"), Suporte.ESPERA)
    }

    @Then("^the suggested recipe \"([^\"]*)\" is marked as saved\$")
    public void sugestaoGuardada(String titulo) {
        WebUI.verifyElementPresent(Suporte.porCss(CARTAO + titulo + "'] [data-testid='recipe-saved']"), Suporte.ESPERA)
        WebUI.verifyElementNotPresent(Suporte.porCss(CARTAO + titulo + "'] [data-testid='recipe-save']"), 2)
    }

    @Then("^the suggested recipe \"([^\"]*)\" is not saved\$")
    public void sugestaoNaoGuardada(String titulo) {
        WebUI.verifyElementPresent(Suporte.porCss(CARTAO + titulo + "'] [data-testid='recipe-save']"), Suporte.ESPERA)
        WebUI.verifyElementNotPresent(Suporte.porCss(CARTAO + titulo + "'] [data-testid='recipe-saved']"), 2)
    }
}
