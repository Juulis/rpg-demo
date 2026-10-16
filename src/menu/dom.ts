type Attrs = Record<string, string | boolean | undefined>;

/** Liten DOM-byggare: textContent i stället för innerHTML, så att hjältenamn aldrig tolkas som HTML. */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Array<Node | string>): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') e.className = String(v);
    else if (k === 'text') e.textContent = String(v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...children);
  return e;
}

export function button(label: string, onClick: () => void, disabled = false, id?: string): HTMLButtonElement {
  const b = el('button', { type: 'button', id, disabled }, label);
  b.addEventListener('click', onClick);
  return b;
}
