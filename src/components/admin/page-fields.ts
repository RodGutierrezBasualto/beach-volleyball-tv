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
   * otherwise items can be added (up to `max`) and removed.
   */
  | {
      type: 'list'; key: string; label: string; hint?: string;
      itemNames?: string[];
      /** What one item is called, e.g. "Team member" (shown as "Team member 1", "Add a team member"…). */
      itemLabel?: string;
      max?: number;
      fields: ListField[];
    };

export interface ListField {
  key: string; label: string; placeholder?: string; max?: number;
  /** A taller box for longer text. */
  long?: boolean;
  width?: 'half' | 'third' | 'wide';
  /** A photo picker (its description is saved under altKey). */
  photo?: { altKey: string; ratio?: number };
}

export interface Section { key: string; title: string; intro: string; toggle?: boolean; fields: Field[] }
