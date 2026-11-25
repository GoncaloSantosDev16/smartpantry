import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling

// SCRUM-143 — Cenários da US-19 (carrossel passo a passo)
CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/CookingCarousel.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)