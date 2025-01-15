import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface BalanceInputProps {
  currentBalance: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  difference: number
}

export function BalanceInput({ 
  currentBalance, 
  value, 
  onChange, 
  disabled,
  difference 
}: BalanceInputProps) {
  const isEarning = difference > 0

  return (
    <div className="space-y-4">
      <div>
        <Label>Current Balance: {currentBalance.toLocaleString()} aUEC</Label>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter new balance"
          className="mt-2"
          disabled={disabled}
        />
      </div>

      {difference !== 0 && (
        <div>
          <Label>Difference: </Label>
          <span className={isEarning ? 'text-green-500' : 'text-red-500'}>
            {isEarning ? '+' : '-'}{Math.abs(difference).toLocaleString()} aUEC
          </span>
        </div>
      )}
    </div>
  )
} 