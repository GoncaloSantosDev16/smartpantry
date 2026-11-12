<template>
  <div class="flex flex-col items-center p-5 w-full">
    <h2 class="text-xl font-bold text-gray-800 mb-4">Carregar Imagem do Produto</h2>

    <div class="w-full max-w-md bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 text-center hover:bg-gray-50 transition-colors">
      
      <!-- Escondido: O input real do ficheiro -->
      <input 
        type="file" 
        accept="image/*" 
        @change="handleFileUpload" 
        ref="fileInput" 
        class="hidden" 
      />

      <div v-if="!imagePreview" class="flex flex-col items-center gap-3">
        <span class="text-4xl">🖼️</span>
        <p class="text-gray-600 font-medium">Tira uma foto ou escolhe da galeria</p>
        <button 
          @click="triggerFileInput"
          class="bg-[#42b883] hover:bg-[#33a06f] text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm mt-2"
        >
          Escolher Imagem
        </button>
      </div>

      <!-- Pré-visualização da imagem carregada -->
      <div v-else class="flex flex-col items-center">
        <img :src="imagePreview" ref="imageElement" class="max-h-64 object-contain rounded-lg shadow-sm mb-4" />
        
        <div class="flex gap-3">
          <button 
            @click="triggerFileInput"
            class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Mudar Imagem
          </button>
          <button 
            @click="scanImage"
            :disabled="isScanning"
            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <span v-if="isScanning" class="animate-spin">⏳</span>
            Ler Código
          </button>
        </div>
      </div>
    </div>

    <!-- Mensagens de Erro (Segue o teu padrão) -->
    <div v-if="erro" class="mt-5 p-4 bg-red-50 border-2 border-red-500 rounded-lg w-full max-w-md text-center shadow-sm">
      <h3 class="text-lg font-bold text-red-800 mb-2">{{ erro.titulo }}</h3>
      <p class="text-red-700 mb-1">{{ erro.mensagem }}</p>
      <p class="text-sm text-red-600 opacity-90">{{ erro.comoResolver }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from "vue";
import { BarcodeDetector } from "barcode-detector";
// Reutilizamos os teus erros para coerência visual
import { descreverErroLeitor } from "@/services/cameraErrors";

const emit = defineEmits(['scanned']);

const fileInput = ref(null);
const imageElement = ref(null);
const imagePreview = ref(null);
const erro = ref(null);
const isScanning = ref(false);

// Abre o menu nativo do telemóvel/PC
const triggerFileInput = () => {
  fileInput.value.click();
};

// Quando o utilizador escolhe uma foto, mostramos no ecrã
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  erro.value = null; // Limpa erros anteriores
  
  // Cria um URL temporário para mostrar a foto no src da <img>
  imagePreview.value = URL.createObjectURL(file);
};

// Função principal: Lança a API em cima da imagem estática
const scanImage = async () => {
  if (!imageElement.value) return;
  
  erro.value = null;
  isScanning.value = true;

  try {
    const detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e", "qr_code"],
    });

    // Ao contrário do vídeo, a imagem é lida apenas uma vez
    const barcodes = await detector.detect(imageElement.value);

    if (barcodes.length > 0) {
      const detectedCode = barcodes[0].rawValue;
      emit('scanned', detectedCode); // A magia acontece aqui!
    } else {
      // Falha natural (não é um erro de sistema, apenas não encontrou código)
      erro.value = {
        titulo: "Nenhum código encontrado",
        mensagem: "A imagem não parece ter um código de barras nítido.",
        comoResolver: "Tenta tirar uma foto mais perto e bem iluminada, ou preenche os dados manualmente em baixo."
      };
    }
  } catch (err) {
    console.error("Erro ao ler imagem estática:", err);
    erro.value = descreverErroLeitor();
  } finally {
    isScanning.value = false;
  }
};
</script>