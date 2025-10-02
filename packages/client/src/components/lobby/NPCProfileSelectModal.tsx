import type { NPCProfilePreview } from "@botc/shared";
import React, { useEffect, useState } from "react";
import { fetchNPCProfilePreviews } from "../../api/npcProfilesApi";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (profileId: string) => Promise<void> | void;
}

export const NPCProfileSelectModal: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [profiles, setProfiles] = useState<NPCProfilePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (open && profiles.length === 0 && !loading) {
      setLoading(true);
      fetchNPCProfilePreviews()
        .then((p) => {
          setProfiles(p);
          const starter = p.find((x) => x.id === "starter-generic");
          setSelected(starter ? starter.id : p[0]?.id || null);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
        .finally(() => setLoading(false));
    }
  }, [open, profiles.length, loading]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
      role="dialog"
      aria-modal
    >
      <div className="bg-gray-800 border border-gray-600 rounded-md w-[520px] max-h-[80vh] flex flex-col shadow-lg">
        <div className="p-3 border-b border-gray-600 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-200">
            Select NPC Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xs"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-3 overflow-y-auto flex-1 space-y-2 text-sm">
          {loading && (
            <div className="text-xs text-gray-400">Loading profiles...</div>
          )}
          {error && <div className="text-xs text-red-400">{error}</div>}
          {!loading &&
            !error &&
            profiles.map((p) => (
              <label
                key={p.id}
                className={`block p-2 rounded border cursor-pointer transition ${selected === p.id ? "border-blue-500 bg-blue-500/10" : "border-gray-600 hover:border-gray-500"}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="npcProfile"
                    value={p.id}
                    checked={selected === p.id}
                    onChange={() => setSelected(p.id)}
                    className="mt-1"
                    aria-label={`Select profile ${p.name}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden>
                        {p.avatar || "🤖"}
                      </span>
                      <span className="font-medium text-gray-100">
                        {p.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 uppercase tracking-wide">
                        {p.difficulty}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {p.description}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.tags?.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-gray-700/60 px-1.5 py-0.5 rounded text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </label>
            ))}
        </div>
        <div className="p-3 border-t border-gray-700 flex justify-end gap-2">
          <button
            className="btn-secondary text-xs"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-primary text-xs"
            disabled={!selected || loading}
            onClick={async () => {
              if (selected) {
                await onConfirm(selected);
                onClose();
              }
            }}
          >
            Add NPC
          </button>
        </div>
      </div>
    </div>
  );
};
