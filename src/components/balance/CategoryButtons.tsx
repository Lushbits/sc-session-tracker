import { Button } from '../ui/button'
import { Label } from '../ui/label'

interface CategoryButtonsProps {
  isEarning: boolean
  categories: string[]
  onSelect: (category: string) => void
  onCustomClick: () => void
}

export function CategoryButtons({
  isEarning,
  categories,
  onSelect,
  onCustomClick
}: CategoryButtonsProps) {
  const buttonColorClass = isEarning ? 
    "bg-green-500 hover:bg-green-600 text-white" : 
    "bg-red-500 hover:bg-red-600 text-white"

  return (
    <div>
      <Label>Record as {isEarning ? 'earning' : 'spending'}:</Label>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {categories.map(category => (
          <Button
            key={category}
            variant="ghost"
            className={buttonColorClass}
            onClick={() => onSelect(category)}
          >
            {category}
          </Button>
        ))}
        <Button
          variant="ghost"
          className={`col-span-2 ${buttonColorClass}`}
          onClick={onCustomClick}
        >
          Custom {isEarning ? 'Earning' : 'Spend'}
        </Button>
      </div>
    </div>
  )
} 