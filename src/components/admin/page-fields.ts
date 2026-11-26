/** Describes the boxes on an admin "edit page" screen (see PageEditor.astro). */
export type Field =
  | { type: 'text' | 'textarea'; key: string; label: string; hint?: string; max?: number; width?: 'half' | 'third' | 'wide'; formatted?: boolean }
  /** Headline + "Words in italic" (keys title / em). */
  | { type: 'headline' }
  | { type: 'paragraphs'; label: string; formatted?: boolean }
  | { type: 'sub'; label: string }
  | { type: 'note'; text: string }
  | { type: 'photo'; key: string; altKey: string; label: string; ratio?: number; width?: 'half'; hint?: string }
  /**
   * A list of items. With itemNames, the list always has exactly those items;
   * otherwise empty rows are offered for adding more, and empty rows are dropped.
   */
  | { type: 'list'; key: string; label: string; itemNames?: string[]; hint?: string; fields: { key: string; label: string; placeholder?: string; max?: number; long?: boolean }[] };

export interface Section { key: string; title: string; intro: string; toggle?: boolean; fields: Field[] }
