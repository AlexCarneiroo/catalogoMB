import { Link } from 'react-router-dom'

export function SmartLink({
  to,
  className,
  children,
}: {
  to: string
  className?: string
  children: string
}) {
  if (to.startsWith('http://') || to.startsWith('https://')) {
    return (
      <a href={to} className={className} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link to={to || '/produtos'} className={className}>
      {children}
    </Link>
  )
}
