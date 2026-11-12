import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling as FailureHandling

// SCRUM-119 — US-09 receitas com base na despensa (Spoonacular simulado).
// Corre com `npm run dev` (o mock só existe em modo de desenvolvimento).
CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/RecipeSuggestions.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)
