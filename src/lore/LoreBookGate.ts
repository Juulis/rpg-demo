/** Spelinput pausas när loreboken är öppen (Game läser detta). */
let open = false;
let closeFn: (() => void) | null = null;

export function setLoreBookOpen(v: boolean): void {
  open = v;
}

export function isLoreBookOpen(): boolean {
  return open;
}

export function registerLoreBookClose(close: () => void): void {
  closeFn = close;
}

export function closeLoreBook(): void {
  closeFn?.();
}
