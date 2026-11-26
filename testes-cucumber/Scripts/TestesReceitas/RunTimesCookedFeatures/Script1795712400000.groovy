import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling

// SCRUM-43 — Cenários da US-15 (contador de vezes que a receita foi cozinhada)
CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/TimesCooked.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)
