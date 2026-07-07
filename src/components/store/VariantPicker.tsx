'use client'

interface VariantPickerProps {
  options: string[]
  selected: string | null
  label: string
  onChange: (value: string) => void
}

export default function VariantPicker({ options, selected, label, onChange }: VariantPickerProps) {
  if (!options?.length) return null

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#86868B]">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
              selected === opt
                ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white'
                : 'border-[#D2D2D7] bg-white text-[#1D1D1F] hover:border-[#86868B]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
