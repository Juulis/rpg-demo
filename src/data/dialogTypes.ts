export type DialogTyp = 'halsning' | 'rykte' | 'quest' | 'bark' | 'avsked';

export interface DialogLineDef {
  id: string;
  /** Saknas eller true = alltid sant (standardreplik, läggs sist i listan). */
  villkor?: unknown;
  text: string;
}

export type DialogNpcBlock = Partial<Record<DialogTyp, DialogLineDef[]>>;

export interface DialogDataFile {
  meta?: { regel?: string };
  npcs: Record<string, DialogNpcBlock>;
}
