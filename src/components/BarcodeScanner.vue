<template>
  <div class="scanner-container">
    <h2>Leitor de Código de Barras</h2>

    <div class="video-wrapper" v-show="isScanning">
      <video ref="video" autoplay playsinline muted></video>
    </div>

    <div class="controls">
      <button @click="startScanner" v-if="!isScanning">Iniciar Câmara</button>
      <button @click="stopScanner" v-if="isScanning">Parar Câmara</button>
    </div>

    <div v-if="scanResult" class="result">
      <h3>Produto Encontrado:</h3>
      <p><strong>Código:</strong> {{ scanResult }}</p>
    </div>

    <div v-if="erro" class="error" role="alert" data-testid="erro-camara">
      <h3>{{ erro.titulo }}</h3>
      <p>{{ erro.mensagem }}</p>
      <p class="como-resolver">{{ erro.comoResolver }}</p>
      <button
        v-if="erro.podeTentarDeNovo"
        @click="startScanner"
        data-testid="tentar-de-novo"
      >
        Tentar novamente
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from "vue";
import { BarcodeDetector } from "barcode-detector";
import {
  descreverErroCamara,
  descreverErroLeitor,
  verificarAmbiente,
} from "@/services/cameraErrors";

const video = ref(null);
const scanResult = ref(null);
const erro = ref(null);
const isScanning = ref(false);

let stream = null;
let detectionInterval = null;

// Uma análise pode falhar pontualmente (frame incompleto, por exemplo).
// Só após falhas seguidas se conclui que o leitor está mesmo indisponível.
const MAX_FALHAS_SEGUIDAS = 5;
let falhasSeguidas = 0;

const startScanner = async () => {
  erro.value = null;
  scanResult.value = null;

  // Condições que impedem sequer tentar: sem HTTPS o browser não expõe o
  // mediaDevices, e a chamada rebentaria com um erro que nada tem a ver
  // com permissões.
  const problemaDeAmbiente = verificarAmbiente();
  if (problemaDeAmbiente) {
    erro.value = problemaDeAmbiente;
    return;
  }

  try {
    // Pedir resolução HD (1280x720) para garantir a nitidez das linhas do código
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { ideal: "environment" },
      },
    });
  } catch (err) {
    erro.value = descreverErroCamara(err);
    console.error("Erro ao aceder à câmara:", err);
    return;
  }

  if (!video.value) {
    stopScanner();
    return;
  }

  video.value.srcObject = stream;
  isScanning.value = true;
  falhasSeguidas = 0;

  let detector;
  try {
    detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e", "qr_code"],
    });
  } catch (err) {
    // O detetor pode falhar a inicializar (por exemplo, o WebAssembly não
    // carregar). Sem isto, a câmara ficaria ligada sem nunca ler nada.
    console.error("Erro ao iniciar o leitor:", err);
    stopScanner();
    erro.value = descreverErroLeitor();
    return;
  }

  // Leitura mais rápida: verifica a cada 200ms
  detectionInterval = setInterval(async () => {
    if (
      !video.value ||
      video.value.readyState < video.value.HAVE_CURRENT_DATA
    ) {
      return;
    }
    try {
      const barcodes = await detector.detect(video.value);
      falhasSeguidas = 0;
      if (barcodes.length > 0) {
        scanResult.value = barcodes[0].rawValue;
        stopScanner();
      }
    } catch (err) {
      falhasSeguidas += 1;
      if (falhasSeguidas >= MAX_FALHAS_SEGUIDAS) {
        console.error("Leitor indisponível:", err);
        stopScanner();
        erro.value = descreverErroLeitor();
      }
    }
  }, 200);
};

const stopScanner = () => {
  isScanning.value = false;
  falhasSeguidas = 0;
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  if (video.value) {
    video.value.srcObject = null;
  }
};

onUnmounted(() => {
  stopScanner();
});
</script>

<style scoped>
.scanner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.video-wrapper {
  width: 100%;
  max-width: 480px;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
}

video {
  width: 100%;
  display: block;
}

.controls button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background-color: #e8f5e9;
  border: 1px solid #4caf50;
  border-radius: 4px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.error {
  margin-top: 20px;
  padding: 15px;
  background-color: #fdecea;
  border: 1px solid #d32f2f;
  border-radius: 4px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  color: #611a15;
}

.error h3 {
  margin: 0 0 8px;
}

.error .como-resolver {
  font-size: 14px;
  opacity: 0.85;
}

.error button {
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #d32f2f;
  color: white;
  cursor: pointer;
}
</style>
