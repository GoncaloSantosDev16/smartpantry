import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import GenAIStatus from './GenAIStatus.vue'

const find = (wrapper, id) => wrapper.find(`[data-testid="${id}"]`)

describe('GenAIStatus', () => {
  it('não mostra nada em repouso', () => {
    const wrapper = mount(GenAIStatus)
    expect(find(wrapper, 'genai-loading').exists()).toBe(false)
    expect(find(wrapper, 'genai-error').exists()).toBe(false)
  })

  it('mostra o loading com o botão de cancelar', async () => {
    const wrapper = mount(GenAIStatus, { props: { loading: true } })
    expect(find(wrapper, 'genai-loading').text()).toContain('Sous-Chef')
    await find(wrapper, 'genai-cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('o loading tem prioridade sobre um erro antigo', () => {
    const wrapper = mount(GenAIStatus, {
      props: { loading: true, error: { code: 'timeout', message: 'Demorou.' } },
    })
    expect(find(wrapper, 'genai-loading').exists()).toBe(true)
    expect(find(wrapper, 'genai-error').exists()).toBe(false)
  })

  it('mostra a mensagem de erro e permite tentar novamente', async () => {
    const wrapper = mount(GenAIStatus, {
      props: { error: { code: 'timeout', message: 'O Sous-Chef demorou demasiado.' } },
    })
    expect(find(wrapper, 'genai-error').text()).toContain('demorou demasiado')
    await find(wrapper, 'genai-retry').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it.each(['missing-key', 'auth', 'bad-request', 'model-unavailable', 'blocked', 'no-ingredients'])(
    'o erro "%s" não oferece "Tentar novamente"',
    (code) => {
      const wrapper = mount(GenAIStatus, { props: { error: { code, message: 'x' } } })
      expect(find(wrapper, 'genai-error').exists()).toBe(true)
      expect(find(wrapper, 'genai-retry').exists()).toBe(false)
    },
  )
})
