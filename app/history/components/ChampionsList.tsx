'use client';

import { useState } from 'react';
import { SeasonData } from '../types';
import { ChevronDownIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ChampionsListProps {
  seasons: SeasonData[];
}

export function ChampionsList({ seasons }: ChampionsListProps) {
  const [expandedYear, setExpandedYear] = useState<string | null>(seasons.length > 0 ? seasons[0].year : null);

  const toggleYear = (year: string) => {
    if (expandedYear === year) {
      setExpandedYear(null);
    } else {
      setExpandedYear(year);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Header - Visual Only based on image */}
      <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 mb-6">
        <div className="flex gap-2">
          <button className="px-4 py-1.5 text-xs font-semibold bg-slate-700 text-white rounded-md shadow-sm border border-slate-600">
            Todos
          </button>
          <button className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors">
            Últimos 5 Anos
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 text-xs text-slate-400 cursor-pointer hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 16 4 4 4-4"/>
            <path d="M7 20V4"/>
            <path d="m21 8-4-4-4 4"/>
            <path d="M17 4v16"/>
          </svg>
          Mais Recentes
        </div>
      </div>

      {seasons.map((season) => {
        const isExpanded = expandedYear === season.year;
        const champion = season.champion;
        const runnerUp = season.runnerUp;
        
        if (!champion) return null;

        // Stats calculation
        const totalGames = champion.wins + champion.losses + champion.ties;
        const winPct = totalGames > 0 ? Math.round((champion.wins / totalGames) * 100) : 0;
        
        // Runner up stats for comparison
        const runnerUpPoints = runnerUp?.pointsFor || 0;
        const championPoints = champion.pointsFor || 0;
        const maxPoints = Math.max(championPoints, runnerUpPoints) * 1.1; // 10% buffer
        const champBarWidth = maxPoints > 0 ? (championPoints / maxPoints) * 100 : 0;
        const runnerUpBarWidth = maxPoints > 0 ? (runnerUpPoints / maxPoints) * 100 : 0;
        const pointDiff = championPoints - runnerUpPoints;

        return (
          <div 
            key={season.year}
            className={`
              w-full bg-slate-900 border transition-all duration-300 overflow-hidden relative
              ${isExpanded ? 'rounded-xl border-amber-500/30 ring-1 ring-amber-500/10' : 'rounded-lg border-slate-800 hover:border-slate-700'}
            `}
          >
            {/* Header / Summary View */}
            <div 
              onClick={() => toggleYear(season.year)}
              className={`
                px-6 py-5 flex items-center cursor-pointer select-none
                ${isExpanded ? 'border-b border-slate-800 bg-slate-900' : 'bg-slate-900 hover:bg-slate-800/50'}
              `}
            >
              {/* Year */}
              <div className={`text-3xl font-bold tracking-tight mr-8 ${isExpanded ? 'text-amber-500' : 'text-slate-500'}`}>
                {season.year}
              </div>

              {/* Champion Mini Info */}
              <div className="flex items-center flex-1">
                <div className="relative mr-4">
                   {champion.avatar ? (
                      <Image 
                        src={champion.avatar} 
                        alt={champion.displayName} 
                        width={48} 
                        height={48} 
                        className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover"
                      />
                   ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                        <UserCircleIcon className="w-6 h-6 text-slate-500" />
                      </div>
                   )}
                   <div className="absolute -bottom-1 -right-1 bg-amber-500 p-0.5 rounded-full border-2 border-slate-900">
                     <TrophyIcon className="w-3 h-3 text-slate-900" />
                   </div>
                </div>
                <div>
                  <h3 className={`font-bold text-lg leading-tight ${isExpanded ? 'text-amber-500' : 'text-slate-200'}`}>
                    {champion.displayName}
                  </h3>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                     <span className="font-medium">{champion.wins} Vitórias</span>
                     <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                     <span>{champion.pointsFor?.toFixed(0) || 0} pts</span>
                  </div>
                </div>
              </div>

              {/* Chevron */}
              <ChevronDownIcon 
                className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-amber-500' : ''}`} 
              />
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-6 bg-slate-900/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="mb-4 flex items-center gap-3">
                   <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5">
                     <TrophyIcon className="w-3.5 h-3.5 text-amber-500" />
                     <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">
                        {season.year} Campeão
                     </span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Stats Box */}
                  <div className="relative rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 overflow-hidden">
                    {/* Watermark Crown */}
                    <div className="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none">
                       <TrophyIcon className="w-48 h-48 text-white" />
                    </div>

                    <div className="relative z-10">
                      <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                         <TrophyIcon className="w-4 h-4 text-amber-500" />
                         Estatísticas do Título
                      </h4>

                      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                         <div>
                           <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Recorde (Reg.)</p>
                           <p className="text-2xl font-bold text-white tracking-tight">{champion.wins}-{champion.losses}</p>
                         </div>
                         <div>
                           <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Pontos Totais</p>
                           <p className="text-2xl font-bold text-amber-400 tracking-tight">{champion.pointsFor?.toFixed(1)}</p>
                         </div>
                         <div>
                           <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Classificação</p>
                           <p className="text-2xl font-bold text-white tracking-tight">#{champion.seed || '-'}</p>
                         </div>
                         <div>
                           <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Aproveitamento</p>
                           <p className="text-2xl font-bold text-white tracking-tight">{winPct}%</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Runner Up & Comparison */}
                  {runnerUp && (
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
                      <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                         <div className="w-4 h-4 rounded-full border border-slate-500 flex items-center justify-center text-[10px] text-slate-400">2</div>
                         Vice-Campeão
                      </h4>

                      <div className="flex items-center gap-4 mb-6">
                         {runnerUp.avatar ? (
                            <Image 
                              src={runnerUp.avatar} 
                              alt={runnerUp.displayName} 
                              width={48} 
                              height={48} 
                              className="w-12 h-12 rounded-full border-2 border-slate-600 grayscale opacity-80"
                            />
                         ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                               <UserCircleIcon className="w-8 h-8 text-slate-500" />
                            </div>
                         )}
                         <div>
                            <h3 className="font-bold text-slate-300">{runnerUp.displayName}</h3>
                            <p className="text-xs font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded inline-block mt-1">
                               {runnerUp.wins}-{runnerUp.losses} • {runnerUp.pointsFor?.toFixed(1)} PTS
                            </p>
                         </div>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
                           <span>Comparativo de Pontos</span>
                           <span className={pointDiff >= 0 ? 'text-amber-500' : 'text-slate-400'}>
                              {pointDiff > 0 ? '+' : ''}{pointDiff.toFixed(1)}
                           </span>
                        </div>
                        
                        <div className="space-y-2">
                           {/* Champion Bar */}
                           <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500" style={{ width: `${champBarWidth}%` }}></div>
                           </div>
                           {/* Runner Up Bar */}
                           <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-500" style={{ width: `${runnerUpBarWidth}%` }}></div>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
