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
    
    <div v-if="errorMessage" class="error">
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { BarcodeDetector } from 'barcode-detector';

const video = ref(null);
const scanResult = ref(null);
const errorMessage = ref('');
const isScanning = ref(false);

let stream = null;
let detectionInterval = null;

const startScanner = async () => {
  errorMessage.value = '';
  scanResult.value = null;

  try {
    // Pedir resolução HD (1280x720) para garantir a nitidez das linhas do código
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { ideal: "environment" }
      }
    });
    
    if (video.value) {
      video.value.srcObject = stream;
      isScanning.value = true;
      
      const detector = new BarcodeDetector({ 
        formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e', 'qr_code'] 
      });

      // Leitura mais rápida: verifica a cada 200ms
      detectionInterval = setInterval(async () => {
        if (video.value && video.value.readyState === video.value.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await detector.detect(video.value);
            if (barcodes.length > 0) {
              scanResult.value = barcodes[0].rawValue;
              stopScanner();
            }
          } catch (err) {
            // Ignorar frames sem leitura
          }
        }
      }, 200);
    }
  } catch (err) {
    errorMessage.value = "Erro ao aceder à câmara. Verifica as permissões.";
    console.error("Erro no leitor:", err);
  }
};

const stopScanner = () => {
  isScanning.value = false;
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
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
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background-color: #e8f5e9;
  border: 1px solid #4CAF50;
  border-radius: 4px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>