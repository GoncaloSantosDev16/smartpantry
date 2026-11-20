// SCRUM-99 — Conteúdo do separador Script do Test Case "RunRecipeSaveFeature".
// Cola-se dentro do Test Case; não é um ficheiro para o Include.

import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling

// Obrigatório desde o Katalon 9. Aponta só para o teu package.
CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/SaveRecipes.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)