import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling as FailureHandling

// US-22 — Descontar stock da despensa (ou saltar).
CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/DeductPantryStock.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)
