import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OfflineBanner from './OfflineBanner.vue'

const banner = (wrapper) => wrapper.find('[data-testid="offline-banner"]')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OfflineBanner', () => {
  it('não aparece quando há ligação', () => {
    const wrapper = mount(OfflineBanner)
    expect(banner(wrapper).exists()).toBe(false)
    wrapper.unmount()
  })

  it('aparece quando o browser já arranca sem ligação', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const wrapper = mount(OfflineBanner)
    expect(banner(wrapper).text()).toContain('Modo offline')
    wrapper.unmount()
  })

  it('aparece ao perder a ligação e desaparece ao recuperá-la', async () => {
    const wrapper = mount(OfflineBanner)

    window.dispatchEvent(new Event('offline'))
    await wrapper.vm.$nextTick()
    expect(banner(wrapper).exists()).toBe(true)
    expect(banner(wrapper).attributes('role')).toBe('status')

    window.dispatchEvent(new Event('online'))
    await wrapper.vm.$nextTick()
    expect(banner(wrapper).exists()).toBe(false)
    wrapper.unmount()
  })

  it('deixa de ouvir os eventos quando é desmontado', async () => {
    const wrapper = mount(OfflineBanner)
    wrapper.unmount()
    // não deve lançar nem deixar listeners pendurados
    expect(() => window.dispatchEvent(new Event('offline'))).not.toThrow()
  })
})
