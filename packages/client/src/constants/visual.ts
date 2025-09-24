// Central visual style constants for lobby character & modifier rings.
// Keep in sync with legend and CharacterGrid.

export const TEAM_RING_CLASSES: Record<string, string> = {
  townsfolk: 'ring-green-500/60',
  outsider: 'ring-blue-400/60',
  minion: 'ring-purple-500/60',
  demon: 'ring-red-500/70',
  traveller: 'ring-amber-400/60',
  fabled: 'ring-purple-400/60',
};

// Script modifier ring accents (when applied directly to a character token)
// Using subtle colored shadow to avoid replacing team ring color; we add an outer ring via box-shadow.
export const MODIFIER_RING_DECORATION: Record<string, string> = {
  requires: 'after:content-[" "] after:absolute after:inset-0 after:rounded-full after:ring-2 after:ring-purple-400/70',
  adjustCounts: 'after:content-[" "] after:absolute after:inset-0 after:rounded-full after:ring-2 after:ring-amber-400/70',
  mutuallyExclusive: 'after:content-[" "] after:absolute after:inset-0 after:rounded-full after:ring-2 after:ring-red-400/70',
  atLeastOneOf: 'after:content-[" "] after:absolute after:inset-0 after:rounded-full after:ring-2 after:ring-green-400/70',
  specialRule: 'after:content-[" "] after:absolute after:inset-0 after:rounded-full after:ring-2 after:ring-sky-400/70',
};

export type ModifierType = keyof typeof MODIFIER_RING_DECORATION;

export function buildCharacterTokenClass(base: string, modifierTypes: string[] = []) {
  const decorations = modifierTypes
    .map((t) => MODIFIER_RING_DECORATION[t])
    .filter(Boolean)
    .join(' ');
  if (!decorations) return base;
  return `${base  } relative ${  decorations}`;
}
