/** Sökvägar till statiska assets i public/assets (Vite serverar public/ från BASE_URL). */
const base = (): string => (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
export const assetUrl = (rel: string): string => `${base()}assets/${rel}`;
