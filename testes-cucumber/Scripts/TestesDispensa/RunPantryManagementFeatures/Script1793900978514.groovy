import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling as FailureHandling

// US-03 / US-04 — Pantry management (add, validate, edit, cancel, remove).
CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/PantryManagement.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)
