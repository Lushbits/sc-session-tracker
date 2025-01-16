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
    "category-button-earning" : 
    "category-button-spending"

  return (
    <div>
      <Label>Record as {isEarning ? 'earning' : 'spending'}:</Label>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {categories.map(category => (
          <Button
            key={category}
            variant="default"
            className={buttonColorClass}
            onClick={() => onSelect(category)}
          >
            {category}
          </Button>
        ))}
        <Button
          variant="default"
          className={`col-span-2 ${buttonColorClass}`}
          onClick={onCustomClick}
        >
          Custom {isEarning ? 'Earning' : 'Spend'}
        </Button>
      </div>
    </div>
  )
} 