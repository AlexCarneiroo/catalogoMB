import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const fieldClass = 'w-full border border-plum/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-gold'

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-muted">{label}</span>
      <input className={fieldClass} {...props} />
    </label>
  )
}

export function TextArea({ label, ...props }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-muted">{label}</span>
      <textarea className={`${fieldClass} min-h-32`} {...props} />
    </label>
  )
}

export function SelectField({ label, children, ...props }: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-muted">{label}</span>
      <select className={fieldClass} {...props}>
        {children}
      </select>
    </label>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 border border-plum/10 bg-white px-4 py-3">
      <span className="text-sm text-plum">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-plum" />
    </label>
  )
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-5 border border-plum/10 bg-white p-5 md:p-8">
      <h2 className="font-serif text-3xl text-plum">{title}</h2>
      {children}
    </section>
  )
}
