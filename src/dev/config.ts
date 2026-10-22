/** Sätt VITE_DEV_CHEATS_MENU=false i build för att stänga av hela utvecklarmenyn. */
const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
export const DEV_CHEATS_MENU_ENABLED = env?.VITE_DEV_CHEATS_MENU !== 'false';
