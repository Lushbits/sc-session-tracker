export const numberUtils = {
  parseDisplayNumber(value: string): number {
    return parseInt(value.replace(/[^\d]/g, ''), 10) || 0
  },

  formatDisplayNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
      useGrouping: true
    }).format(value)
  },

  formatInputValue(value: string): string {
    const number = this.parseDisplayNumber(value)
    return this.formatDisplayNumber(number)
  },

  calculateDifference(newValue: number, currentValue: number): number {
    return newValue - currentValue
  }
} 