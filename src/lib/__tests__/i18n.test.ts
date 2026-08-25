import { beforeEach, describe, expect, it } from 'vitest'
import { setLocale, t, useI18n } from '../i18n'

describe('i18n', () => {
  beforeEach(() => {
    setLocale('zh')
  })

  it('默认中文，可切换英文并持久化', () => {
    expect(t('nav.tarot')).toBe('塔罗')
    setLocale('en')
    expect(t('nav.tarot')).toBe('Tarot')
    expect(localStorage.getItem('wo-locale')).toBe('en')
    setLocale('zh')
  })

  it('支持 {param} 插值', () => {
    setLocale('en')
    expect(t('lib.count', { n: 12 })).toBe('12 cards')
    setLocale('zh')
    expect(t('lib.count', { n: 78 })).toContain('78')
  })

  it('未知 key 原样返回（渐进迁移安全网）', () => {
    expect(t('no.such.key')).toBe('no.such.key')
  })

  it('useI18n 暴露响应式 locale 与 isZh，toggle 双向翻转', () => {
    setLocale('zh')
    const { locale, isZh, toggleLocale } = useI18n()
    expect(isZh.value).toBe(true)
    toggleLocale()
    expect(locale.value).toBe('en')
    expect(isZh.value).toBe(false)
    toggleLocale()
    expect(locale.value).toBe('zh')
    expect(isZh.value).toBe(true)
  })
})
