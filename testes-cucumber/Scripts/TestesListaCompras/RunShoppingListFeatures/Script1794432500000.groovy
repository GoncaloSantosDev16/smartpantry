import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling as FailureHandling

// SCRUM-112 — US-24 lista de compras
CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/ShoppingList.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)
