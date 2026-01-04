'use client';

import { SleeperDraft, SleeperTradedPick, Team, SleeperBracketMatch } from '@/lib/sleeper';
import Image from 'next/image';
import { useMemo } from 'react';

interface DraftOrderListProps {
  draft: SleeperDraft;
  tradedPicks: SleeperTradedPick[];
  teams: Team[];
  winnersBracket: SleeperBracketMatch[];
}

export function DraftOrderList({ draft, tradedPicks, teams, winnersBracket }: DraftOrderListProps) {
  // Sorting Logic
  // 1. Identify Playoff Teams (from winnersBracket)
  // 2. Sort Non-Playoff Teams by Record (Worst -> Best)
  // 3. Sort Playoff Teams by Finish (implied by Record or Bracket logic? User implies "taking playoffs into account" means they draft LAST).
  // 4. Override 'lzpck' to 1st pick.

  const sortedSlots = useMemo(() => {
    // If draft_order is explicitly set in API, verify if we should use it.
    // However, user specifically asked for "classificação dessa temporada" with considerations.
    // Often pre-draft order in Sleeper is alphabetical until randomized or set. 
    // We will prefer our calculated order unless the draft is already 'drafting'.
    if (draft.status === 'drafting' && draft.draft_order) {
       const orderMap = draft.draft_order;
       return [...teams].sort((a, b) => (orderMap[a.ownerId] ?? 999) - (orderMap[b.ownerId] ?? 999));
    }

    // Identify Playoff Teams & Buckets
    let championId: number | null = null;
    let runnerUpId: number | null = null;
    const semiFinalLosers: number[] = [];
    const quarterFinalLosers: number[] = [];
    
    // Determine number of rounds to infer structure
    const maxRound = winnersBracket.length > 0 ? Math.max(...winnersBracket.map(m => m.r)) : 0;
    
    if (winnersBracket.length > 0) {
        // 1. Champion & Runner Up (Finals - Max Round, p=1 or undefined)
        const finalsMatch = winnersBracket.find(m => m.r === maxRound && (!m.p || m.p === 1));
        if (finalsMatch) {
            championId = finalsMatch.w;
            runnerUpId = finalsMatch.l;
        }

        // 2. Semi-Final Losers (Losers of Round: MaxRound - 1)
        // Ignoring 3rd place match results as requested.
        const sfRound = maxRound - 1;
        if (sfRound > 0) {
            winnersBracket.filter(m => m.r === sfRound).forEach(m => {
                if (m.l) semiFinalLosers.push(m.l);
            });
        }

        // 3. Quarter-Final Losers (Losers of Round: MaxRound - 2)
        const qfRound = maxRound - 2;
        if (qfRound > 0) {
            winnersBracket.filter(m => m.r === qfRound).forEach(m => {
                if (m.l) quarterFinalLosers.push(m.l);
            });
        }
    }

    const playoffRosterIds = new Set<number>();
    winnersBracket.forEach(m => {
        if (m.t1) playoffRosterIds.add(m.t1);
        if (m.t2) playoffRosterIds.add(m.t2);
    });

    // Buckets for sorting
    const nonPlayoffTeams: Team[] = [];
    const qfLoserTeams: Team[] = [];
    const sfLoserTeams: Team[] = [];
    
    // Will hold RunnerUp then Champion separately

    teams.forEach(t => {
        if (playoffRosterIds.has(t.rosterId)) {
            if (t.rosterId === championId) {
                // Determine order later
            } else if (t.rosterId === runnerUpId) {
                // Determine order later
            } else if (quarterFinalLosers.includes(t.rosterId)) {
                qfLoserTeams.push(t);
            } else if (semiFinalLosers.includes(t.rosterId)) {
                sfLoserTeams.push(t);
            } else {
                // Edge case: Treat as SF loser level if undefined
                 sfLoserTeams.push(t);
            }
        } else {
            nonPlayoffTeams.push(t);
        }
    });

    // Helper Sort: Record (Wins ASC, PF ASC)
    const recordSort = (a: Team, b: Team) => {
        if (a.wins !== b.wins) return a.wins - b.wins;
        return a.pointsFor - b.pointsFor;
    };

    nonPlayoffTeams.sort(recordSort);
    qfLoserTeams.sort(recordSort);
    sfLoserTeams.sort(recordSort);

    // Final Order Construction
    const baseOrder = [...nonPlayoffTeams, ...qfLoserTeams, ...sfLoserTeams];
    
    // Add Runner Up (2nd Last)
    if (runnerUpId) {
        const runnerUp = teams.find(t => t.rosterId === runnerUpId);
        if (runnerUp) baseOrder.push(runnerUp);
    }
    
    // Add Champion (Last)
    if (championId) {
        const champion = teams.find(t => t.rosterId === championId);
        if (champion) baseOrder.push(champion);
    }
    
    // Allow mutating for splice logic
    const finalOrder = [...baseOrder];

    // --- OVERRIDE LOGIC ---
    // User Request: "lzpck é o 1st pick devido a ter vencido um confronto direto"
    const lzpckIndex = finalOrder.findIndex(t => 
        t.displayName.toLowerCase().includes('lzpck') || 
        t.ownerId === 'lzpck' 
    );

    if (lzpckIndex > -1) {
        const [lzpckTeam] = finalOrder.splice(lzpckIndex, 1);
        finalOrder.unshift(lzpckTeam);
    }
    
    return finalOrder;

  }, [teams, draft.draft_order, draft.status, winnersBracket]);
  
  // Create lookup map for teams
  const teamMap = useMemo(() => {
    return teams.reduce((acc, team) => {
      acc[team.rosterId] = team;
      return acc;
    }, {} as Record<number, Team>);
  }, [teams]);

  // Function to find current owner of Round 1 pick for a given slot
  const getRound1Owner = (originalRosterId: number) => {
    // --- MANUAL TRADE OVERRIDES ---
    // User Request: "DiegoGuedes19 possui a pick do Casalmir"
    const casalmirBox = teams.find(t => t.displayName.toLowerCase().includes('casalmir'));
    const diegoBox = teams.find(t => t.displayName.toLowerCase().includes('diegoguedes19'));

    if (casalmirBox && diegoBox && originalRosterId === casalmirBox.rosterId) {
        return diegoBox;
    }
    // ------------------------------

    const trade = tradedPicks.find(p => p.round === 1 && p.roster_id === originalRosterId);
    if (trade) {
      return teamMap[trade.owner_id] || teamMap[originalRosterId];
    }
    return teamMap[originalRosterId];
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm overflow-hidden max-w-4xl mx-auto border border-border">
      <div className="p-4 border-b border-border bg-surface-hover/50">
        <h2 className="text-xl font-bold text-text text-center">
            {draft.season} Draft Order (Round 1)
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-hover text-xs uppercase text-text-muted font-bold border-b border-border">
            <tr>
              <th className="px-4 py-3 text-center w-16">Pick</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-center">Record</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">PF</th>
               <th className="px-4 py-3 text-center hidden sm:table-cell">MaxPF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedSlots.map((originalTeam, idx) => {
               const pickNumber = idx + 1;
               const currentOwner = getRound1Owner(originalTeam.rosterId);
               const isTraded = currentOwner && currentOwner.rosterId !== originalTeam.rosterId;
               
               if (!currentOwner) return null; 

               return (
                 <tr key={originalTeam.rosterId} className="hover:bg-surface-hover transition-colors">
                   <td className="px-4 py-3 text-center font-bold text-text-muted">
                      1.{pickNumber.toString().padStart(2, '0')}
                   </td>
                   <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 relative flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full overflow-hidden relative border-2 ${isTraded ? 'border-amber-500' : 'border-border'}`}>
                                {currentOwner.avatarUrl ? (
                                    <Image src={currentOwner.avatarUrl} alt={currentOwner.displayName} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-surface-hover flex items-center justify-center font-bold text-text-muted text-xs">
                                        {currentOwner.displayName.substring(0,2)}
                                    </div>
                                )}
                            </div>
                         </div>
                         
                         <div className="flex flex-col">
                            <span className="font-semibold text-text text-base">
                               {currentOwner.displayName}
                            </span>
                            {isTraded && (
                                <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                                   via {originalTeam.displayName}
                                </span>
                            )}
                         </div>
                      </div>
                   </td>
                   
                   <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-surface-hover font-mono font-medium text-text">
                         {originalTeam.wins}-{originalTeam.losses}{originalTeam.ties > 0 ? `-${originalTeam.ties}` : ''}
                      </div>
                   </td>
                   
                   <td className="px-4 py-3 text-center text-text-muted hidden sm:table-cell font-mono text-xs">
                      {originalTeam.pointsFor.toFixed(2)}
                   </td>

                   <td className="px-4 py-3 text-center text-text-muted hidden sm:table-cell font-mono text-xs">
                       {originalTeam.ppts?.toFixed(2) || '-'}
                   </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="bg-surface-hover/30 px-4 py-3 text-xs text-text-muted text-center border-t border-border">
         * Ordem: Recorde (Não Playoff) &rarr; Eliminados QF &rarr; Eliminados Semi &rarr; Finais. &quot;lzpck&quot; é o 1.01 devido a ter vencido o confronto direto contra o homemfutebol.
      </div>
    </div>
  );
}
