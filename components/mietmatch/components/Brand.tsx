'use client'

import Image from 'next/image'

type BrandProps = {
  /** Larger mark for auth / onboarding heroes */
  size?: 'sm' | 'md' | 'lg'
}

export function Brand({ size = 'sm' }: BrandProps) {
  const markPx = size === 'lg' ? 72 : size === 'md' ? 48 : 36

  return (
    <div className={`brand brand-${size}`}>
      <span className="mark" aria-hidden="true">
        <Image
          src="/brand/besichtigo-mark.png"
          alt=""
          width={markPx}
          height={Math.round(markPx * 0.89)}
          priority
        />
      </span>
      <strong className="brand-name">BesichtiGo</strong>
    </div>
  )
}
