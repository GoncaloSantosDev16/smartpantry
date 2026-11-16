import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling as FailureHandling

// SCRUM-108 — US-06 alerta de itens a expirar (48h).
CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/ExpiringAlert.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)
