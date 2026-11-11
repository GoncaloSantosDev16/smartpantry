# Integração com GenAI (TS-04)

## Ficheiros
| Ficheiro | Subtarefa | Função |
|---|---|---|
| `src/services/genai.js` | SCRUM-92, 94, 95 | Comunicação com a API, tratamento de erros, leitura da chave |
| `src/services/genaiPrompts.js` | SCRUM-93 | Construção dos prompts e validação da resposta |
| `.env.example` | SCRUM-95 | Modelo das variáveis de ambiente |

## Configuração
1. Copiar `.env.example` para `.env.local`.
2. Preencher `VITE_GENAI_API_KEY` com a chave pessoal (Google AI Studio).
3. Reiniciar `npm run dev` (o Vite só lê o `.env.local` ao arrancar).

O `.gitignore` ignora `.env`, `.env.*` e `*.local`, só `.env.example` vai para o Git.

> **Limitação conhecida:** a app não tem backend, por isso qualquer variável `VITE_*`
> fica visível no bundle final. Para a cadeira serve, mas a chave deve ser pessoal,
> com quota limitada, e nunca ser colocada no repositório.

## Utilização
```js
import { generateRecipe, isGenAIConfigured } from '@/services/genai'

const result = await generateRecipe({
  ingredients: [{ name: 'Arroz', quantity: 200, unit: 'g' }],
  profile: activeProfile, // { servings, diets, allergies, excludedIngredients }
})

if (result.status === 'ok') {
  console.log(result.recipe) // { title, steps: [{ text, timerSeconds }], ... }
} else {
  alert(result.message) // mensagem pronta a mostrar; result.code identifica o erro
}
```
`generateText(prompt, options)` serve para pedidos genéricos. Nunca lança exceções.

## Códigos de erro
| code | Quando |
|---|---|
| `missing-key` | Falta `VITE_GENAI_API_KEY` |
| `timeout` | A API não respondeu em 30 s (configurável com `timeoutMs`) |
| `aborted` | O pedido foi cancelado com um `AbortSignal` |
| `network` | Sem ligação à internet |
| `auth` | Chave inválida ou sem permissões (401/403, ou 400 com "API key") |
| `rate-limit` | Limite de pedidos atingido (429) |
| `model-unavailable` | O modelo configurado já não existe (404). Mudar `VITE_GENAI_MODEL` |
| `bad-request` | Pedido rejeitado (outros 4xx) |
| `server` | Serviço indisponível (5xx) |
| `blocked` | A IA recusou gerar o conteúdo |
| `empty` | Resposta sem texto |
| `invalid-response` | A resposta não é uma receita válida |
| `no-ingredients` | Nenhum ingrediente selecionado |

## Trocar de fornecedor
Só é preciso alterar `buildRequest()` e `extractText()` em `genai.js`.
O modelo e o URL base também se mudam por variáveis de ambiente.

## Estados de loading (SCRUM-94)
`src/composables/useRecipeGenerator.js` devolve `loading`, `error`, `recipe`, `generate()`,
`cancel()` e `reset()`, e evita pedidos duplicados enquanto há um em curso.
`src/components/GenAIStatus.vue` mostra o spinner (com botão "Cancelar") e a mensagem de erro
(com "Tentar novamente" só nos erros que podem passar sozinhos).

```vue
<script setup>
import { useRecipeGenerator } from '@/composables/useRecipeGenerator'
import GenAIStatus from '@/components/GenAIStatus.vue'

const { loading, error, recipe, generate, cancel } = useRecipeGenerator()
const gerar = () => generate({ ingredients, profile })
</script>

<template>
  <GenAIStatus :loading="loading" :error="error" @cancel="cancel" @retry="gerar" />
</template>
```
