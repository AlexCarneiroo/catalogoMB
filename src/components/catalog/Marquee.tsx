export function Marquee({ words }: { words: string[] }) {
  const line = words.length > 0 ? words : ['Ritual', 'Brilho', 'Cuidado', 'Pele']
  const repeated = [...line, ...line, ...line, ...line]

  return (
    <div className="marquee-mask overflow-hidden border-y border-plum/10 py-4">
      <div className="marquee-track flex w-max gap-8">
        {repeated.map((word, index) => (
          <span key={`${word}-${index}`} className="flex items-center gap-8 font-serif text-2xl text-plum italic md:text-3xl">
            {word}
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />
          </span>
        ))}
      </div>
    </div>
  )
}
