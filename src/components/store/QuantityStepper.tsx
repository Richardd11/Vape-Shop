'use client'

import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

export default function QuantityStepper({ value, min = 1, max = 99, onChange }: QuantityStepperProps) {
  return (
    <div className="store-quantity">
      <button
        className="store-quantity-button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span>
        {value}
      </span>
      <button
        className="store-quantity-button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
