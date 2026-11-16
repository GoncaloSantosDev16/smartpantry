import { describe, it, expect } from 'vitest'
import {
  expirationTime,
  isExpired,
  isExpiringSoon,
  filterExpiringItems,
  daysUntil,
  expiryLabel,
} from './expiration'

// Segunda, 16 de novembro de 2026, 10:00 (hora local)
const now = new Date(2026, 10, 16, 10, 0, 0)
const item = (name, expirationDate) => ({ name, expirationDate })

describe('expirationTime', () => {
  it('uma data "AAAA-MM-DD" vale até ao fim desse dia (hora local)', () => {
    expect(expirationTime('2026-11-17')).toBe(new Date(2026, 10, 17, 23, 59, 59, 999).getTime())
  })

  it('aceita datas ISO completas e ignora valores vazios ou inválidos', () => {
    expect(expirationTime('2026-11-17T12:00:00.000Z')).toBe(Date.parse('2026-11-17T12:00:00.000Z'))
    expect(expirationTime('')).toBeNull()
    expect(expirationTime(null)).toBeNull()
    expect(expirationTime('amanhã')).toBeNull()
  })
})

describe('SCRUM-106: isExpiringSoon (validade <= agora + 48h)', () => {
  it.each([
    ['ontem', '2026-11-15', true],
    ['hoje', '2026-11-16', true],
    ['amanhã', '2026-11-17', true],
    ['daqui a 2 dias (passa as 48h)', '2026-11-18', false],
    ['daqui a 10 dias', '2026-11-26', false],
  ])('%s -> %s', (_, date, expected) => {
    expect(isExpiringSoon(item('x', date), now)).toBe(expected)
  })

  it('itens sem validade nunca entram no alerta', () => {
    expect(isExpiringSoon(item('Sal', null), now)).toBe(false)
    expect(isExpiringSoon({ name: 'Sal' }, now)).toBe(false)
  })

  it('o limite das 48h conta (<=)', () => {
    const limit = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
    expect(isExpiringSoon(item('x', limit), now)).toBe(true)
  })
})

describe('filterExpiringItems', () => {
  it('filtra e ordena pelos mais urgentes', () => {
    const list = filterExpiringItems(
      [item('Arroz', '2026-12-01'), item('Leite', '2026-11-17'), item('Fiambre', '2026-11-15'), item('Sal', null)],
      now,
    )
    expect(list.map((i) => i.name)).toEqual(['Fiambre', 'Leite'])
  })

  it('aceita lista vazia ou inválida', () => {
    expect(filterExpiringItems([], now)).toEqual([])
    expect(filterExpiringItems(null, now)).toEqual([])
  })
})

describe('isExpired / daysUntil / expiryLabel', () => {
  it('distingue expirado de a expirar', () => {
    expect(isExpired(item('x', '2026-11-15'), now)).toBe(true)
    expect(isExpired(item('x', '2026-11-16'), now)).toBe(false)
  })

  it('conta dias de calendário', () => {
    expect(daysUntil('2026-11-16', now)).toBe(0)
    expect(daysUntil('2026-11-17', now)).toBe(1)
    expect(daysUntil('2026-11-15', now)).toBe(-1)
  })

  it.each([
    ['2026-11-15', 'Expirado'],
    ['2026-11-16', 'Expira hoje'],
    ['2026-11-17', 'Expira amanhã'],
    ['2026-11-20', 'Expira em 4 dias'],
    ['', ''],
  ])('%s -> "%s"', (date, label) => {
    expect(expiryLabel(date, now)).toBe(label)
  })
})
