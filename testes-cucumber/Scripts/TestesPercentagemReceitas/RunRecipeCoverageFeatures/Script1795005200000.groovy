import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling as FailureHandling

// SCRUM-38 — US-10 % de ingredientes da receita na despensa.
CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/RecipeCoverage.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)
