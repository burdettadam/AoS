import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

export const useScriptProposals = () => {
  const { currentGame, seatId, availableScripts } = useGameStore();

  const scriptLookup = useMemo(() => {
    const byId: Record<string, any> = {};
    for (const script of availableScripts) {
      byId[script.id] = script;
    }
    return byId;
  }, [availableScripts]);

  const scriptProposalsData = useMemo(() => {
    const raw = currentGame?.scriptProposals || [];
    return raw.map((proposal: any) => {
      const script = scriptLookup[proposal.scriptId] || 
        availableScripts.find((s: any) => s.id === proposal.scriptId);
      const votes = proposal.votes || {};
      const entries = Object.entries(votes) as Array<[string, boolean]>;
      const upVotes = entries.filter(([, vote]) => vote === true).length;
      const downVotes = entries.filter(([, vote]) => vote === false).length;
      const myVote = seatId ? votes[seatId] : undefined;
      const proposers: string[] = Array.isArray(proposal.proposers)
        ? proposal.proposers
        : proposal.proposedBy
          ? [proposal.proposedBy]
          : [];
      const isProposer = seatId ? proposers.includes(seatId) : false;
      const createdAt = proposal.createdAt ? new Date(proposal.createdAt).getTime() : 0;
      const score = upVotes - downVotes;
      return {
        proposal,
        script,
        upVotes,
        downVotes,
        myVote,
        isProposer,
        createdAt,
        score,
        proposers
      };
    }).sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.upVotes !== a.upVotes) return b.upVotes - a.upVotes;
      if (a.downVotes !== b.downVotes) return a.downVotes - b.downVotes;
      return a.createdAt - b.createdAt;
    });
  }, [currentGame?.scriptProposals, scriptLookup, availableScripts, seatId]);

  const proposalByScriptId = useMemo(() => {
    const map = new Map<string, any>();
    for (const entry of scriptProposalsData) {
      map.set(entry.proposal.scriptId, entry);
    }
    return map;
  }, [scriptProposalsData]);

  const togglePlayerProposal = async (scriptId: string) => {
    if (!currentGame?.id || !seatId) return;
    const existing = proposalByScriptId.get(scriptId);
    const alreadyProposer = existing ? existing.proposers.includes(seatId) : false;
    try {
      await fetch(`/api/games/${currentGame.id}/scripts/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          proposerSeatId: seatId, 
          scriptId, 
          active: !alreadyProposer 
        })
      });
    } catch (error) {
      console.error('Failed to toggle script proposal', error);
    }
  };

  const submitProposalVote = async (proposalId: string, vote: boolean | null) => {
    if (!currentGame?.id || !seatId) return;
    try {
      await fetch(`/api/games/${currentGame.id}/scripts/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterSeatId: seatId, proposalId, vote })
      });
    } catch (error) {
      console.error('Failed to submit script vote', error);
    }
  };

  return {
    scriptProposalsData,
    proposalByScriptId,
    togglePlayerProposal,
    submitProposalVote,
  };
};