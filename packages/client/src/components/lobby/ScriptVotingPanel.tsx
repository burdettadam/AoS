import React, { useRef } from 'react';
import type { LoadedScript } from '@botc/shared';
import ScriptProposalCard from './ScriptProposalCard';

interface ScriptProposalData {
  proposal: any;
  script?: LoadedScript;
  upVotes: number;
  downVotes: number;
  myVote?: boolean | null;
  isProposer: boolean;
  createdAt: number;
  score: number;
  proposers: string[];
}

interface ScriptVotingPanelProps {
  scriptProposalsData: ScriptProposalData[];
  onScriptSelect: (scriptId: string) => void;
  onVote: (proposalId: string, vote: boolean | null) => void;
  className?: string;
}

const ScriptVotingPanel: React.FC<ScriptVotingPanelProps> = ({
  scriptProposalsData,
  onScriptSelect,
  onVote,
  className = '',
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollContainerBy = (delta: number) => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300">Player Voting</div>
        {scriptProposalsData.length > 0 && (
          <div className="text-xs text-gray-500">
            Sorted by popularity (👍 minus 👎)
          </div>
        )}
      </div>
      
      <div className="relative mt-3">
        <button
          type="button"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
          onClick={() => scrollContainerBy(-320)}
          aria-label="Scroll proposed scripts left"
        >
          ←
        </button>
        
        <div
          ref={scrollerRef}
          data-testid="proposal-carousel"
          className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth px-12"
        >
          {scriptProposalsData.length > 0 ? (
            scriptProposalsData.map((entry) => (
              <ScriptProposalCard
                key={entry.proposal.id}
                proposal={entry.proposal}
                script={entry.script}
                upVotes={entry.upVotes}
                downVotes={entry.downVotes}
                myVote={entry.myVote}
                isProposer={entry.isProposer}
                score={entry.score}
                proposerCount={entry.proposers.length}
                onScriptSelect={onScriptSelect}
                onVote={onVote}
              />
            ))
          ) : (
            <div className="text-gray-400 text-sm py-6 px-4 w-full text-center">
              No proposed scripts yet. Press + above to start a vote.
            </div>
          )}
        </div>
        
        <button
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/85 hover:bg-clocktower-dark/95 border border-gray-700 rounded-full w-9 h-9 flex items-center justify-center text-lg text-gray-200 shadow"
          onClick={() => scrollContainerBy(320)}
          aria-label="Scroll proposed scripts right"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default ScriptVotingPanel;