import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import static com.kms.katalon.core.testobject.ObjectRepository.findWindowsObject
import com.kms.katalon.core.checkpoint.Checkpoint as Checkpoint
import com.kms.katalon.core.cucumber.keyword.CucumberBuiltinKeywords as CucumberKW
import com.kms.katalon.core.mobile.keyword.MobileBuiltInKeywords as Mobile
import com.kms.katalon.core.model.FailureHandling as FailureHandling
import com.kms.katalon.core.testcase.TestCase as TestCase
import com.kms.katalon.core.testdata.TestData as TestData
import com.kms.katalon.core.testng.keyword.TestNGBuiltinKeywords as TestNGKW
import com.kms.katalon.core.testobject.TestObject as TestObject
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.windows.keyword.WindowsBuiltinKeywords as Windows
import internal.GlobalVariable as GlobalVariable
import org.openqa.selenium.Keys as Keys

WebUI.openBrowser('')

WebUI.navigateToUrl('http://localhost:5173/')

WebUI.click(findTestObject('Page_Vite App/button_Continuar'))

WebUI.click(findTestObject('Page_Vite App/label_Pescetariano'))

WebUI.click(findTestObject('Page_Vite App/button_Continuar'))

WebUI.setText(findTestObject('Page_Vite App/input_Ingredientes excludos'), 'a')

WebUI.click(findTestObject('Page_Vite App/button_Concluir'))

WebUI.click(findTestObject('Page_Vite App/button_Adicionar Item'))

WebUI.click(findTestObject('Page_Vite App/span_O nome  obrigatrio'))

WebUI.verifyElementText(findTestObject('Page_Vite App/span_O nome  obrigatrio'), 'O nome é obrigatório.')

WebUI.closeBrowser()

