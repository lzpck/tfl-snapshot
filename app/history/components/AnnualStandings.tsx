'use client';

import { useState, useMemo } from 'react';
import { SeasonData } from '../types';
import { ChevronDownIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface AnnualStandingsProps {
  seasons: SeasonData[];
}

export function AnnualStandings({ seasons }: AnnualStandingsProps) {
  // Sort years desc just in case
  const sortedSeasons = useMemo(() => [...seasons].sort((a, b) => parseInt(b.year) - parseInt(a.year)), [seasons]);
  
  const [selectedYear, setSelectedYear] = useState<string>(sortedSeasons.length > 0 ? sortedSeasons[0].year : '');

  const activeSeason = useMemo(() => sortedSeasons.find(s => s.year === selectedYear), [sortedSeasons, selectedYear]);

  if (!activeSeason) return <div className="p-8 text-center text-slate-500">Nenhum dado disponível</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header with Filter */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
             <TrophyIcon className="w-5 h-5 text-amber-500" />
           </div>
           <div>
             <h3 className="font-bold text-slate-100 leading-tight">Classificação</h3>
             <p className="text-xs text-slate-500">Histórico anual detalhado</p>
           </div>
        </div>

        <div className="relative group">
           <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none bg-slate-800 text-slate-300 pl-4 pr-10 py-2 rounded-lg border border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-600 cursor-pointer hover:bg-slate-750"
           >
             {sortedSeasons.map(s => (
               <option key={s.year} value={s.year}>Temporada {s.year}</option>
             ))}
           </select>
           <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-slate-300" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
           <thead className="bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
             <tr>
               <th className="px-6 py-3 text-center w-16">Pos</th>
               <th className="px-6 py-3">Time</th>
               <th className="px-6 py-3 hidden md:table-cell">Manager</th>
               <th className="px-4 py-3 text-center">V</th>
               <th className="px-4 py-3 text-center">D</th>
               <th className="px-4 py-3 text-center text-slate-600">E</th>
               <th className="px-4 py-3 text-center text-emerald-500">PCT</th>
               <th className="px-6 py-3 text-right">PF</th>
               <th className="px-6 py-3 text-right text-slate-600">PA</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-800/50">
             {activeSeason.standings.map((team, index) => {
               const isChampion = activeSeason.champion?.rosterId === team.rosterId;
               // My Standing interface is: rank, displayName... no rosterId? 
               // The API response for standings usually has rosterId? 
               // Let's check api route mapping. It maps from Teams which have rosterId. 
               // I need to update Standing interface to include rosterId to be safe, 
               // OR check by displayName. DisplayName is unique usually.
               
               const rank = index + 1;
               const totalGames = team.wins + team.losses + team.ties;
               const pct = totalGames > 0 ? Math.round(((team.wins + (team.ties * 0.5)) / totalGames) * 100) : 0;
               
               // Highlighting
               let rowClass = "hover:bg-slate-800/30 transition-colors group";
               let posClass = "text-slate-500 font-medium";
               let nameClass = "text-slate-300 font-medium group-hover:text-white";
               
               if (rank === 1) {
                  posClass = "text-blue-500 font-bold bg-blue-500/10 rounded w-6 h-6 flex items-center justify-center mx-auto";
               } else if (rank === 2) {
                  posClass = "text-slate-400 font-bold bg-slate-700/30 rounded w-6 h-6 flex items-center justify-center mx-auto";
               } else if (rank === 3) {
                  posClass = "text-amber-700 font-bold bg-amber-900/10 rounded w-6 h-6 flex items-center justify-center mx-auto";
               }

               if (isChampion) {
                 rowClass += " bg-amber-500/5 hover:bg-amber-500/10";
                 nameClass = "text-amber-500 font-bold";
               }

               return (
                 <tr key={index} className={rowClass}>
                   <td className="px-6 py-4 text-center">
                     <span className={posClass}>{rank}</span>
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="relative">
                           {team.avatar ? (
                             <Image 
                               src={team.avatar} 
                               alt={team.displayName} 
                               width={32} 
                               height={32} 
                               className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                             />
                           ) : (
                             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                               <UserCircleIcon className="w-5 h-5 text-slate-500" />
                             </div>
                           )}
                           {isChampion && (
                             <div className="absolute -top-1 -right-1">
                               <TrophyIcon className="w-3 h-3 text-amber-500 drop-shadow-sm" />
                             </div>
                           )}
                        </div>
                        <div className="flex flex-col">
                           <span className={nameClass}>{team.displayName}</span>
                           {isChampion && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider leading-none">Campeão</span>}
                           {/* Removing 'vice' logic here unless I map it explicitly */}
                        </div>
                     </div>
                   </td>
                   <td className="px-6 py-4 hidden md:table-cell text-slate-500 text-xs">
                     {team.ownerId || '-'} {/* Fallback to ownerId or placeholder */}
                   </td>
                   <td className="px-4 py-4 text-center text-slate-300 font-medium">{team.wins}</td>
                   <td className="px-4 py-4 text-center text-slate-400">{team.losses}</td>
                   <td className="px-4 py-4 text-center text-slate-600">{team.ties || '-'}</td>
                   <td className="px-4 py-4 text-center font-bold text-emerald-500">{pct}%</td>
                   <td className="px-6 py-4 text-right text-slate-300 font-mono tracking-tight">{team.pointsFor.toFixed(1)}</td>
                   <td className="px-6 py-4 text-right text-slate-600 font-mono tracking-tight text-xs">{team.pointsAgainst.toFixed(1)}</td>
                 </tr>
               );
             })}
           </tbody>
        </table>
      </div>
    </div>
  );
}
