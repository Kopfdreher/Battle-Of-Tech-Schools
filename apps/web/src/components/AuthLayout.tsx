import type { ReactNode } from 'react'
import { Brand } from './Brand.tsx'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <section className="auth-story">
        <Brand />
        <h1>Is this street a good place to live?</h1>
        <p className="lede">
          Other apps already filter rent, rooms, and size. Kiezbrief checks the environment around a Berlin address
          with open data: noise, Kita and schools, commute, Spielplatz, bars and cafés, accessibility, parking, and
          supermarket.
        </p>
        <ol className="points">
          <li>
            <span>1</span>
            <p>Paste or write any Berlin address you want to check.</p>
          </li>
          <li>
            <span>2</span>
            <p>Score the surroundings against the Berlin data criteria you care about.</p>
          </li>
        </ol>
      </section>
      <section className="auth-panel">
        <div className="auth-card panel">{children}</div>
      </section>
    </div>
  )
}
