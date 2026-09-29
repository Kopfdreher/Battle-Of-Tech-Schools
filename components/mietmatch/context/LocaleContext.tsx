'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LOCALES, translate, type Locale } from '../i18n/messages'
import { readJson, writeJson } from '../lib/storage'

const localeKey = 'mietmatch.locale'

type LocaleValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  locales: typeof LOCALES
}

const LocaleContext = createContext<LocaleValue | null>(null)

function detectLocale(): Locale {
  const stored = readJson<string | null>(localeKey, null)
  if (stored === 'en' || stored === 'de') return stored
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en'
  return nav.startsWith('de') ? 'de' : 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLocaleState(detectLocale())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    writeJson(localeKey, locale)
    document.documentElement.lang = locale
  }, [locale, ready])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, locales: LOCALES }),
    [locale, setLocale, t],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used within LocaleProvider')
  return value
}
