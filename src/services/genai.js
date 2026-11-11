// TS-04: ponto único de comunicação com a API de IA generativa.
//   SCRUM-92: ficheiro global que gere a comunicação com a API
//   SCRUM-93: construção dos prompts  -> ver genaiPrompts.js
//   SCRUM-94: tratamento de erros (timeout, rede, limites, etc.)
//   SCRUM-95: chave lida de variáveis de ambiente (.env.local, fora do Git)
//
// Segue a convenção de productsApi.js e recipesApi.js: NUNCA lança exceções,
// devolve sempre { status: 'ok', ... } ou { status: 'error', code, message }.
//
// Fornecedor por defeito: Google Gemini (REST). Para trocar de fornecedor, só é
// preciso alterar buildRequest() e extractText() neste ficheiro.

import { buildRecipePrompt, buildSystemPrompt, parseRecipeResponse } from './genaiPrompts'

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
// Os modelos do Gemini são retirados com frequência: se aparecer 'model-unavailable',
// define VITE_GENAI_MODEL no .env.local com um modelo atual (não é preciso mexer no código).
const DEFAULT_MODEL = 'gemini-3.8-flash'
const DEFAULT_TIMEOUT_MS = 30000

export const GENAI_ERRORS = {
  MISSING_KEY: 'missing-key',
  TIMEOUT: 'timeout',
  ABORTED: 'aborted',
  NETWORK: 'network',
  AUTH: 'auth',
  RATE_LIMIT: 'rate-limit',
  BAD_REQUEST: 'bad-request',
  MODEL_UNAVAILABLE: 'model-unavailable',
  SERVER: 'server',
  BLOCKED: 'blocked',
  EMPTY: 'empty',
  INVALID_RESPONSE: 'invalid-response',
  NO_INGREDIENTS: 'no-ingredients',
}

// Mensagens prontas a mostrar ao utilizador
const MESSAGES = {
  'missing-key': 'A chave da API de IA não está configurada. Define VITE_GENAI_API_KEY no ficheiro .env.local.',
  timeout: 'O Sous-Chef demorou demasiado a responder. Tenta novamente.',
  aborted: 'Pedido cancelado.',
  network: 'Sem ligação à internet. Liga-te e tenta novamente.',
  auth: 'A chave da API de IA é inválida ou não tem permissões.',
  'rate-limit': 'Atingiste o limite de pedidos à IA. Espera um minuto e tenta novamente.',
  'bad-request': 'O pedido à IA foi rejeitado. Tenta com menos ingredientes.',
  'model-unavailable': 'O modelo de IA configurado já não está disponível. Atualiza VITE_GENAI_MODEL no ficheiro .env.local.',
  server: 'O serviço de IA está indisponível neste momento. Tenta mais tarde.',
  blocked: 'A IA não conseguiu gerar uma receita com estes ingredientes.',
  empty: 'A IA devolveu uma resposta vazia. Tenta novamente.',
  'invalid-response': 'A IA devolveu uma receita num formato inesperado. Tenta novamente.',
  'no-ingredients': 'Seleciona pelo menos um ingrediente.',
}

const fail = (code, extra = {}) => ({ status: 'error', code, message: MESSAGES[code], ...extra })

// Lemos as variáveis em cada chamada (e não à entrada do módulo) para poderem ser
// alteradas nos testes. VITE_* é lido do .env.local pelo Vite.
function getConfig() {
  const env = import.meta.env
  return {
    apiKey: env.VITE_GENAI_API_KEY,
    model: env.VITE_GENAI_MODEL || DEFAULT_MODEL,
    baseUrl: env.VITE_GENAI_BASE_URL || DEFAULT_BASE_URL,
  }
}

/** true se existir uma chave configurada (útil para desativar o botão do Sous-Chef). */
export function isGenAIConfigured() {
  return Boolean(getConfig().apiKey)
}

// --- Fornecedor (Gemini) ------------------------------------------------------

function buildRequest({ apiKey, model, baseUrl }, prompt, { systemInstruction, json, temperature }) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
    ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
  }
  return {
    // A chave vai num cabeçalho e não no URL, para não aparecer em logs nem no histórico
    url: `${baseUrl}/models/${model}:generateContent`,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
  }
}

function extractText(data) {
  if (data?.promptFeedback?.blockReason) return fail(GENAI_ERRORS.BLOCKED)
  const candidate = data?.candidates?.[0]
  if (!candidate) return fail(GENAI_ERRORS.EMPTY)
  if (['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'RECITATION'].includes(candidate.finishReason)) {
    return fail(GENAI_ERRORS.BLOCKED)
  }
  const text = (candidate.content?.parts ?? [])
    .map((p) => p?.text ?? '')
    .join('')
    .trim()
  if (!text) return fail(GENAI_ERRORS.EMPTY)
  return { status: 'ok', text }
}

// --- Erros HTTP -----------------------------------------------------------------

async function codeFromHttpError(res) {
  let detail = ''
  try {
    detail = (await res.json())?.error?.message ?? ''
  } catch {
    // corpo sem JSON: ignoramos
  }
  // O Gemini responde 400 (e não 401) quando a chave é inválida
  if (/api key/i.test(detail)) return { code: GENAI_ERRORS.AUTH, detail }
  if (res.status === 401 || res.status === 403) return { code: GENAI_ERRORS.AUTH, detail }
  if (res.status === 429) return { code: GENAI_ERRORS.RATE_LIMIT, detail }
  // 404: o modelo foi retirado ou o nome está errado
  if (res.status === 404) return { code: GENAI_ERRORS.MODEL_UNAVAILABLE, detail }
  if (res.status >= 500) return { code: GENAI_ERRORS.SERVER, detail }
  return { code: GENAI_ERRORS.BAD_REQUEST, detail }
}

// --- API pública ----------------------------------------------------------------

/**
 * Envia um prompt à IA e devolve o texto gerado.
 * Opções: systemInstruction, json (pede resposta JSON), temperature, timeoutMs,
 *         signal (AbortSignal para cancelar), fetchImpl (para testes).
 * Devolve { status: 'ok', text } ou { status: 'error', code, message }.
 */
export async function generateText(prompt, options = {}) {
  const {
    systemInstruction,
    json = false,
    temperature = 0.7,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    fetchImpl = globalThis.fetch,
  } = options

  const config = getConfig()
  if (!config.apiKey) return fail(GENAI_ERRORS.MISSING_KEY)

  // Um único AbortController serve para o timeout e para o cancelamento externo
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onExternalAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onExternalAbort, { once: true })
  }

  try {
    const request = buildRequest(config, prompt, { systemInstruction, json, temperature })
    const res = await fetchImpl(request.url, {
      method: 'POST',
      headers: request.headers,
      body: request.body,
      signal: controller.signal,
    })

    if (!res.ok) {
      const { code, detail } = await codeFromHttpError(res)
      return fail(code, { httpStatus: res.status, detail })
    }

    let data
    try {
      data = await res.json()
    } catch {
      return fail(GENAI_ERRORS.INVALID_RESPONSE)
    }
    return extractText(data)
  } catch (error) {
    if (error?.name === 'AbortError') return fail(timedOut ? GENAI_ERRORS.TIMEOUT : GENAI_ERRORS.ABORTED)
    return fail(GENAI_ERRORS.NETWORK, { detail: error?.message })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onExternalAbort)
  }
}

/**
 * GenAI Sous-Chef: gera uma receita original com as sobras e o perfil ativo.
 * ingredients = [{ name, quantity, unit }]
 * profile     = { servings, diets, allergies, excludedIngredients }
 * Devolve { status: 'ok', recipe } ou { status: 'error', code, message }.
 */
export async function generateRecipe({ ingredients, profile } = {}, options = {}) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return fail(GENAI_ERRORS.NO_INGREDIENTS)

  const result = await generateText(buildRecipePrompt({ ingredients, profile }), {
    ...options,
    systemInstruction: buildSystemPrompt(),
    json: true,
  })
  if (result.status === 'error') return result

  const parsed = parseRecipeResponse(result.text)
  if (!parsed.ok) return fail(GENAI_ERRORS.INVALID_RESPONSE, { detail: parsed.reason })
  return { status: 'ok', recipe: parsed.recipe }
}
