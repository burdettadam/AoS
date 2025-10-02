import type { NPCProfilePreview } from "@botc/shared";

export async function fetchNPCProfilePreviews(): Promise<NPCProfilePreview[]> {
  const res = await fetch("/api/ai/npc-profiles");
  if (!res.ok) throw new Error("Failed to fetch NPC profiles");
  const data = await res.json();
  return data.profiles as NPCProfilePreview[];
}
