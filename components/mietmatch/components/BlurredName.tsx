'use client'

type Props = {
  name: string
  className?: string
  as?: 'span' | 'strong' | 'h1' | 'h2'
}

/** Show a name visually blurred for privacy (real text remains in the DOM for layout). */
export function BlurredName({ name, className = '', as: Tag = 'span' }: Props) {
  return (
    <Tag className={['name-blur', className].filter(Boolean).join(' ')} title="Name hidden">
      {name || 'Applicant'}
    </Tag>
  )
}
