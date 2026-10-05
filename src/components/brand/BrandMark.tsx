import { cn } from '@/utils/format'

export const brandAssets = {
  logo: '/brand/logo.png',
  logoIvory: '/brand/logo-ivory.png',
  monogram: '/brand/monogram.png',
  pattern: '/brand/pattern.png',
}

export function Wordmark({
  variant = 'plum',
  className,
  alt,
}: {
  variant?: 'plum' | 'ivory'
  className?: string
  alt: string
}) {
  return (
    <img
      src={variant === 'ivory' ? brandAssets.logoIvory : brandAssets.logo}
      alt={alt}
      className={cn('w-auto object-contain object-left', className)}
    />
  )
}

export function Monogram({ className, alt = '' }: { className?: string; alt?: string }) {
  return <img src={brandAssets.monogram} alt={alt} className={cn('object-contain', className)} />
}
