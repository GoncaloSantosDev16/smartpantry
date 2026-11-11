// SCRUM-105 — Conteúdo do separador Script do Test Case "RunProfileFeatures".
// Cola-se dentro do Test Case; não é um ficheiro para o Include.

import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.model.FailureHandling

CucumberKW.GLUE = ['smartpantry.steps']

CucumberKW.runFeatureFile(
    'Include/features/switch-profile.feature',
    [:],
    FailureHandling.CONTINUE_ON_FAILURE)