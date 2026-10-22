/** Mat och andra förbrukningsvaror (ersätter gamla drycker/potions). */
export function isConsumableCategory(category: string): boolean {
  return category === 'mat' || category === 'dryck';
}
