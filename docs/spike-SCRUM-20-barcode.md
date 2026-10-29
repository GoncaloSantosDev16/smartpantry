# SCRUM-20 — Escolha da biblioteca de leitura de códigos de barras

## Objetivo

Escolher e justificar a tecnologia de leitura de códigos de barras do SmartPantry.

## Restrição que condiciona tudo

O SmartPantry é uma **PWA**, não uma app nativa. A leitura tem de acontecer no
browser, o que exclui à partida os SDK nativos (ML Kit, AVFoundation).

Além disso, a API `BarcodeDetector` que os browsers Chromium oferecem
nativamente **não existe no Safari/iOS**. Qualquer solução que dependa só dela
deixa os iPhones sem funcionalidade.

## Critérios

1. Suporta **EAN-13 / EAN-8 / UPC** (os códigos dos produtos alimentares) — eliminatório
2. Funciona em **Android e iOS**
3. **Manutenção ativa**
4. **Peso no bundle** (numa PWA o arranque é funcionalidade)
5. **Licença permissiva**

## Porque rejeitámos

**`html5-qrcode`** — sem lançamentos desde **abril de 2023**. É a mais sugerida em
tutoriais, mas três anos e meio parada numa biblioteca que depende de APIs de
câmara em evolução é risco a sério. Traz ainda interface própria, que teríamos de
substituir para respeitar o design em Tailwind.

**`quagga2`** — bem mantida, mas **só lê códigos 1D**. Cumpre o mínimo (EAN-13) e
nada mais; fecha a porta a QR codes sem oferecer vantagem nenhuma em troca.

**`@zxing/library`** — funciona, mas é o **pacote mais pesado** (11,31 MB contra
0,25 MB) e continua em versão 0.x ao fim de oito anos. Expõe API própria, logo
trocar de solução mais tarde obrigaria a reescrever o código de leitura.

**`BarcodeDetector` nativo sozinho** — a melhor opção onde existe: zero bytes e
desempenho do sistema operativo. Mas **não existe em iOS**, e falha o critério 2.

## Decisão: `barcode-detector`

Não é a escolha de um motor, é uma **arquitetura de duas camadas com uma só API**:

- **Android** → delega na API nativa do sistema (rápido, sem descarregar nada)
- **iOS** → cai automaticamente para ZXing em WebAssembly

### Porquê esta

- **É a única que cobre as duas plataformas sem duplicar código na app.**
- **Manutenção mais recente** do conjunto (2026-10-19).
- **O mais leve** (0,25 MB); o WebAssembly só é descarregado onde a API nativa
  falta, portanto o utilizador Android não paga o custo do fallback.
- **Licença MIT.**
- **Segue a especificação W3C.** Se o Safari implementar a API nativamente, basta
  remover a biblioteca — o código da app fica igual. É o argumento decisivo face
  à `@zxing/library`, que nos prenderia a uma API proprietária.

## Fontes

- Registo npm (versões, datas, licenças), consultado a 2026-10-28
- Suporte da BarcodeDetector API: https://caniuse.com/mdn-api_barcodedetector
- `barcode-detector`: https://www.npmjs.com/package/barcode-detector
- Comparação de leitores open-source: https://scanbot.io/blog/popular-open-source-javascript-barcode-scanners/
- Ausência da API em iOS: https://dev.to/ilhannegis/barcode-scanning-on-ios-the-missing-web-api-and-a-webassembly-solution-2in2
