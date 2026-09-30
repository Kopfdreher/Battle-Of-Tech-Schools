'use client'

import { useSession } from '../context/session'

type Props = {
  name: string
  className?: string
  as?: 'span' | 'strong' | 'h1' | 'h2'
}

/** Real name by default; blur when the landlord turns names off. */
export function BlurredName({ name, className = '', as: Tag = 'span' }: Props) {
  const { namesVisible } = useSession()
  const label = name || 'Applicant'

  return (
    <Tag
      className={[namesVisible ? 'name-clear' : 'name-blur', className].filter(Boolean).join(' ')}
      title={namesVisible ? label : 'Name hidden'}
    >
      {label}
    </Tag>
  )
}
