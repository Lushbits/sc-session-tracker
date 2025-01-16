import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { CheckIcon } from 'lucide-react'

interface CustomInputSectionProps {
  isEarning: boolean
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function CustomInputSection({
  isEarning,
  value,
  onChange,
  onSubmit
}: CustomInputSectionProps) {
  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${isEarning ? 'earning' : 'spending'} description`}
        autoFocus
      />
      <Button
        size="icon"
        className={isEarning ? "category-button-earning" : "category-button-spending"}
        disabled={!value}
        onClick={onSubmit}
      >
        <CheckIcon className="h-4 w-4" />
      </Button>
    </div>
  )
} 