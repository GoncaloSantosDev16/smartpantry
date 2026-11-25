import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling as FailureHandling

// US-21 — Resumo de ingredientes consumidos (confirmar/ajustar).
CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/ConsumedIngredientsSummary.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)
