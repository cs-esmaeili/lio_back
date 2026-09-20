export const ProductSort = {
  NEWEST: 'newest',
  CHEAPEST: 'cheapest',
  MOST_EXPENSIVE: 'most_expensive',
} as const;

export type ProductSort = (typeof ProductSort)[keyof typeof ProductSort];
