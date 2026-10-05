import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/format'

const variants = {
  primary: 'bg-plum text-ivory hover:bg-plum-deep',
  gold: 'border border-gold/80 text-plum hover:bg-gold/10',
  light: 'border border-gold text-ivory hover:bg-ivory/10',
  ghost: 'text-plum hover:bg-plum/5',
  danger: 'border border-rose text-plum hover:bg-rose-soft',
} as const

export function buttonClass(variant: keyof typeof variants = 'primary', className?: string): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-semibold tracking-[0.08em] transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
    variants[variant],
    className,
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />
}

export function ButtonLink({
  to,
  variant = 'primary',
  className,
  children,
}: {
  to: string
  variant?: keyof typeof variants
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={buttonClass(variant, className)}>
      {children}
    </Link>
  )
}
