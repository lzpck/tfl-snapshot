'use client';

import { SleeperDraft, SleeperTradedPick, Team } from '@/lib/sleeper';
import Image from 'next/image';
import { useMemo } from 'react';

interface DraftBoardProps {
  draft: SleeperDraft;
  tradedPicks: SleeperTradedPick[];
  teams: Team[];
  leagueId: string;
}

export function DraftBoard({ draft, tradedPicks, teams }: DraftBoardProps) {
  const rounds = draft.settings.rounds;
  // Dynasty rookie drafts generally linear, but let's check settings
  const isLinear = draft.type !== 'snake'; 

  // Memoize sorted teams/slots to avoid recalculation
  const sortedSlots = useMemo(() => {
    const slots = [...teams];
    
    if (draft.draft_order) {
      const orderMap = draft.draft_order;
      // map ownerId -> order. Some users might not be in the map if they left? 
      // Usually draft_order matches user_id. 
      // Note: team.ownerId matches sleeper user_id.
      
      slots.sort((a, b) => {
        // Sleeper order values can be anything generally ascending
        const orderA = orderMap[a.ownerId];
        const orderB = orderMap[b.ownerId];
        
        // Handle undefined just in case
        if (orderA === undefined && orderB === undefined) return 0;
        if (orderA === undefined) return 1;
        if (orderB === undefined) return -1;
        
        return orderA - orderB;
      });
    } else {
      // Fallback: Reverse Standings logic for Linear Draft
      // Sort by Wins ASC, then Points For ASC (approximation for MaxPF)
      // This is a common specific logic for Dynasty:
      // - 1. Wins (Low to High)
      // - 2. Points (Low to High)
      // Note: This logic is imperfect for mixed playoff/non-playoff teams without explicit brackets.
      // But it serves as a good default "Projected Order".
      
      slots.sort((a, b) => {
        if (a.wins !== b.wins) return a.wins - b.wins;
        // If wins tied, lower points gets better pick
        return a.pointsFor - b.pointsFor;
      });
    }
    return slots;
  }, [teams, draft.draft_order]);

  // Map to help find current owner details quickly
  const teamMap = useMemo(() => {
    return teams.reduce((acc, team) => {
      acc[team.rosterId] = team;
      return acc;
    }, {} as Record<number, Team>);
  }, [teams]);

  // Helper to find pick owner
  const getPickOwner = (round: number, originalRosterId: number) => {
    // Find latest trade involving this pick
    // tradedPicks has { round, roster_id (original), owner_id (new) }
    // If there are multiple entries for the same round/original_roster_id, we need the one that represents the final state.
    // However, Sleeper API usually returns the simplified "current owner" in the traded_picks array for that specific slot.
    // If a pick A->B->C, Sleeper might list A->B and B->C, or just A->C.
    // Actually, Sleeper `traded_picks` for a specific draft usually returns just the list of picks that are NOT owned by the original owner.
    // So if roster_id X matches originalRosterId AND round matches, use owner_id.
    
    // There can be weird cases, but finding the match is usually enough.
    const trade = tradedPicks.find(p => p.round === round && p.roster_id === originalRosterId);
    
    if (trade) {
       return teamMap[trade.owner_id] || teamMap[originalRosterId]; // Fallback to original if owner not found (rare)
    }
    
    return teamMap[originalRosterId];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">
             {draft.season} {isLinear ? 'Linear' : 'Snake'} Draft
           </h2>
           <p className="text-sm text-gray-500">
             {draft.status === 'complete' ? 'Completo' : draft.status === 'drafting' ? 'Em andamento' : 'Projeção / Futuro'}
           </p>
        </div>
        <div className="text-sm text-gray-500">
           {rounds} Rounds
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-3 bg-gray-100 dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700 sticky left-0 z-10 w-16 text-center text-xs font-bold text-gray-500 uppercase">
                Rnd
              </th>
              {sortedSlots.map((team, idx) => (
                <th key={team.rosterId} className="p-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 min-w-[140px] text-center">
                   <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-gray-400 mb-2">SLOT {idx + 1}</span>
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full overflow-hidden relative bg-gray-200">
                           {team.avatarUrl ? (
                             <Image src={team.avatarUrl} alt={team.displayName} fill className="object-cover" />
                           ) : (
                             <span className="flex items-center justify-center w-full h-full text-[10px]">{team.displayName.substring(0,2)}</span>
                           )}
                         </div>
                         <span className="font-semibold text-gray-700 dark:text-gray-300 max-w-[100px] truncate">{team.displayName}</span>
                      </div>
                   </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rounds }).map((_, i) => {
              const round = i + 1;
              return (
                <tr key={round} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="p-3 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 sticky left-0 font-bold text-center text-gray-500">
                    {round}
                  </td>
                  {sortedSlots.map((originalTeam, idx) => {
                    const currentOwner = getPickOwner(round, originalTeam.rosterId);
                    const isTraded = currentOwner.rosterId !== originalTeam.rosterId;
                    
                    if (!currentOwner) return <td key={idx}>-</td>;

                    return (
                      <td key={idx} className={`p-2 border-b border-gray-200 dark:border-gray-700 text-center relative ${isTraded ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                         <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                            {/* Pick Number Label */}
                            <span className="text-[10px] font-mono text-gray-400">
                               {round}.{(idx + 1).toString().padStart(2, '0')}
                            </span>
                            
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full relative overflow-hidden border-2 shadow-sm ${isTraded ? 'border-amber-400' : 'border-gray-100 dark:border-gray-600'}`}>
                               {currentOwner.avatarUrl ? (
                                 <Image src={currentOwner.avatarUrl} alt={currentOwner.displayName} fill className="object-cover" />
                               ) : (
                                  <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                                    {currentOwner.displayName.substring(0,2)}
                                  </div>
                               )}
                            </div>
                            
                            {/* Name */}
                            <span className={`text-xs font-medium truncate max-w-[120px] ${isTraded ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>
                              {currentOwner.displayName}
                            </span>

                            {/* Trade Indicator Badge */}
                            {isTraded && (
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                 via {originalTeam.displayName}
                               </span>
                            )}
                         </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
