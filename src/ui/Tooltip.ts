/** En DOM-tooltip (Cinzel-stil) som följer muspekaren och undviker skärmkanterna. */
export class Tooltip {
  readonly el = document.createElement('div');

  constructor() {
    this.el.className = 'rk-tip hidden';
    document.body.appendChild(this.el);
  }

  show(html: string, x: number, y: number, quality?: string): void {
    if (this.el.innerHTML !== html) this.el.innerHTML = html;
    this.el.dataset.q = quality ?? '';
    this.el.classList.remove('hidden');
    const w = this.el.offsetWidth;
    const h = this.el.offsetHeight;
    let px = x + 16;
    let py = y + 18;
    if (px + w > innerWidth - 6) px = x - w - 12;
    if (py + h > innerHeight - 6) py = y - h - 12;
    this.el.style.left = Math.max(6, px) + 'px';
    this.el.style.top = Math.max(6, py) + 'px';
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  dispose(): void {
    this.el.remove();
  }
}
