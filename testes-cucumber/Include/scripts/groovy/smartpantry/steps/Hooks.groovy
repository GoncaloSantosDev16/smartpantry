package smartpantry.steps

import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import io.cucumber.java.After
import io.cucumber.java.Before

/**
 * SCRUM-69 — Preparação e limpeza de cada cenário.
 *
 * Sem isto, o perfil criado num cenário sobrevive para o seguinte e todos os
 * cenários de primeiro arranque falham a partir do segundo.
 */
public class Hooks {

    @Before
    public void abrirAplicacao() {
        WebUI.openBrowser(Suporte.BASE_URL)
        WebUI.maximizeWindow()
        WebUI.waitForPageLoad(Suporte.ESPERA)
    }

    @After
    public void fecharAplicacao() {
        WebUI.closeBrowser()
    }
}