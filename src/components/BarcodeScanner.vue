<template>
  <div class="flex flex-col items-center p-5 w-full">
    <h2 class="text-xl font-bold text-gray-800 mb-4">Leitor de Código de Barras</h2>

    <div class="w-full max-w-md mb-5 rounded-lg overflow-hidden bg-black shadow-lg" v-show="isScanning">
      <video ref="video" class="w-full block" autoplay playsinline muted></video>
    </div>

    <div class="flex gap-4">
      <button 
        @click="startScanner" 
        v-if="!isScanning"
        class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow"
      >
        Iniciar Câmara
      </button>
      
      <button 
        @click="stopScanner" 
        v-if="isScanning"
        class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow"
      >
        Parar Câmara
      </button>
    </div>

    <div v-if="scanResult" class="mt-5 p-4 bg-green-50 border-2 border-green-500 rounded-lg w-full max-w-md text-center shadow-sm">
      <h3 class="text-lg font-bold text-green-800 mb-1">Produto Encontrado:</h3>
      <p class="text-green-900 font-mono text-lg">{{ scanResult }}</p>
    </div>

    <div v-if="erro" class="mt-5 p-4 bg-red-50 border-2 border-red-500 rounded-lg w-full max-w-md text-center shadow-sm" role="alert" data-testid="erro-camara">
      <h3 class="text-lg font-bold text-red-800 mb-2">{{ erro.titulo }}</h3>
      <p class="text-red-700 mb-1">{{ erro.mensagem }}</p>
      <p class="text-sm text-red-600 opacity-90 mb-4">{{ erro.comoResolver }}</p>
      
      <button
        v-if="erro.podeTentarDeNovo"
        @click="startScanner"
        data-testid="tentar-de-novo"
        class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, defineEmits } from "vue";
import { BarcodeDetector } from "barcode-detector";
import {
  descreverErroCamara,
  descreverErroLeitor,
  verificarAmbiente,
} from "@/services/cameraErrors";

// Declara o evento para enviar o código para o HomeView.vue
const emit = defineEmits(['scanned']);

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
        const detectedCode = barcodes[0].rawValue;
        scanResult.value = detectedCode;
        stopScanner();
        
        // Emite o evento para que o HomeView.vue receba o código e adicione à despensa
        emit('scanned', detectedCode); 
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

