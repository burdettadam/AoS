import type { LoadedScript } from "@botc/shared";
import React from "react";

interface ScriptProposalCardProps {
  proposal: any;
  script?: LoadedScript;
  upVotes: number;
  downVotes: number;
  myVote?: boolean | null;
  isProposer: boolean;
  score: number;
  proposerCount: number;
  onScriptSelect: (scriptId: string) => void;
  onVote: (proposalId: string, vote: boolean | null) => void;
}

const ScriptProposalCard: React.FC<ScriptProposalCardProps> = ({
  proposal,
  script,
  upVotes,
  downVotes,
  myVote,
  isProposer,
  score,
  proposerCount,
  onScriptSelect,
  onVote,
}) => {
  const scriptName = script?.name || proposal.scriptId;
  const complexity = script?.meta?.complexity;
  const voteUpActive = myVote === true;
  const voteDownActive = myVote === false;

  return (
    <div
      data-testid={`proposal-card-${proposal.id}`}
      className={`shrink-0 w-60 border rounded-lg px-3 py-3 bg-clocktower-dark border-gray-700 transition ${
        myVote !== null ? "shadow-[0_0_0_1px_rgba(56,189,248,0.15)]" : ""
      }`}
    >
      <button
        className="text-left w-full"
        onClick={() => onScriptSelect(proposal.scriptId)}
      >
        <div
          className="text-base font-semibold text-gray-100 truncate"
          title={scriptName}
        >
          {scriptName}
        </div>
        {complexity && (
          <div className="text-[11px] text-gray-400 uppercase tracking-wide mt-1">
            {complexity}
          </div>
        )}
      </button>

      <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
        <span>
          {proposerCount} proposer{proposerCount === 1 ? "" : "s"}
        </span>
        {isProposer && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">
            You proposed
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          className={`px-3 py-1 rounded border text-sm font-semibold transition ${
            voteUpActive
              ? "bg-emerald-400 text-black border-emerald-300"
              : "border-gray-700 text-gray-100 hover:border-gray-500"
          }`}
          onClick={() => onVote(proposal.id, voteUpActive ? null : true)}
          aria-pressed={voteUpActive}
          data-testid={`vote-up-${proposal.id}`}
        >
          👍 {upVotes}
        </button>
        <button
          type="button"
          className={`px-3 py-1 rounded border text-sm font-semibold transition ${
            voteDownActive
              ? "bg-rose-500 text-black border-rose-300"
              : "border-gray-700 text-gray-100 hover:border-gray-500"
          }`}
          onClick={() => onVote(proposal.id, voteDownActive ? null : false)}
          aria-pressed={voteDownActive}
          data-testid={`vote-down-${proposal.id}`}
        >
          👎 {downVotes}
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Popularity score: {score}
      </div>
    </div>
  );
};

export default ScriptProposalCard;
