import { profitDisplayStyles as styles } from './chartConfig'

interface ProfitDisplayProps {
  profitPerHour: number
}

export function ProfitDisplay({ profitPerHour }: ProfitDisplayProps) {
  const isPositive = profitPerHour >= 0
  const valueClass = `${styles.value} ${isPositive ? styles.positive : styles.negative}`

  return (
    <div className="mt-2">
      <div className={styles.label}>Profit/hr</div>
      <div className={valueClass}>
        {isPositive ? '+' : ''}{profitPerHour.toLocaleString()} aUEC
      </div>
    </div>
  )
} 