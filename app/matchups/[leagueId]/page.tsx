'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MatchupView } from '@/lib/matchups';
import MatchupCard from '@/app/components/MatchupCard';
import Bracket from '@/app/components/Bracket';
import { getLeagueConfig } from '@/lib/env-validation';
import { ChevronRightIcon, CalendarDaysIcon, TrophyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function MatchupsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  // Obter configurações das ligas
  const leagueConfig = getLeagueConfig();
  
  const [matchupData, setMatchupData] = useState<MatchupView | null>(null);
  const [leagueInfo, setLeagueInfo] = useState<{ week: number; season: string; previousLeagueId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Default to 1
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'list' | 'bracket'>('list');

  // Ref for scrolling the week selector
  const weekSelectorRef = useRef<HTMLDivElement>(null);
  
  // Determinar tipo de liga e estrutura de semanas
  const { leagueName, schedule, leagueType } = useMemo(() => {
    const isRedraft = leagueId === leagueConfig.redraft;
    const type = isRedraft ? 'redraft' : 'dynasty';
    const name = type === 'redraft' ? 'TFL: Classic' : 'TFL: Dynasty';
    
    return { 
      leagueType: type,
      leagueName: name, 
      schedule: {
        regular: type === 'redraft' ? { start: 1, end: 14 } : { start: 1, end: 13 },
        playoffs: type === 'redraft' ? { start: 15, end: 17 } : { start: 14, end: 17 }
      }
    };
  }, [leagueId, leagueConfig]);

  // Fetch initial league info (current week + previous league id)
  useEffect(() => {
    const fetchLeagueInfo = async () => {
      try {
        // Fetch explicit league details to get previous_league_id
        const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);
        if (res.ok) {
          const data = await res.json();
          // Sleeper specific fields
          // Let's rely on internal API for week if possible, or fallback.
          // Actually, let's use our internal standings API which standardizes this.
          
          const internalRes = await fetch(`/api/standings?league=${leagueId}&limit=1`);
          const internalData = internalRes.ok ? await internalRes.json() : { week: 1, season: data.season };
          
          setLeagueInfo({ 
              week: internalData.week || 1, 
              season: data.season,
              previousLeagueId: data.previous_league_id 
          });
          
          setSelectedWeek(Math.max(1, Math.min(internalData.week || 1, 17)));
        }
      } catch (e) {
        console.error("Failed to fetch league info", e);
      }
    };
    fetchLeagueInfo();
  }, [leagueId]);

  // Scroll current week into view when loaded
  useEffect(() => {
    if (weekSelectorRef.current && leagueInfo) {
       setTimeout(() => {
         const activeBtn = weekSelectorRef.current?.querySelector('[data-active="true"]');
         if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
         }
       }, 500);
    }
  }, [leagueInfo, selectedWeek]);
  
  // Buscar dados dos confrontos
  useEffect(() => {
    let isCancelled = false;
    
    const fetchMatchups = async () => {
        if (!leagueId) return;
        
        try {
            setLoading(true);
            
            let url = `/api/matchups?league=${leagueId}&week=${selectedWeek}`;
            if (viewMode === 'bracket') {
                url += '&view=bracket';
            }

            const response = await fetch(url);
            
            if (isCancelled) return;
            
            if (!response.ok) {
                // If 404 or empty, we handle it in UI, but API might throw error
                // Let's assume API returns empty pairs if no matchups
            }
            
            const data: MatchupView = await response.json();
            
            if (!isCancelled) {
                setMatchupData(data);
            }
        } catch (err) {
            if (!isCancelled) {
                console.warn("Matchup fetch error:", err);
                // Don't set error string immediately if it's just empty data, 
                // but if it's a real error, set it.
                // For now, let's just clear data so UI shows empty state.
                setMatchupData(null);
            }
        } finally {
            if (!isCancelled) {
                setLoading(false);
            }
        }
    };

    fetchMatchups();
    
    return () => {
      isCancelled = true;
    };
  }, [leagueId, selectedWeek, viewMode]);

  // Helpers
  const weeks = Array.from({ length: 17 }, (_, i) => i + 1);
  const currentWeek = leagueInfo?.week || 1;
  const hasMatchups = matchupData && (matchupData.pairs.length > 0 || (matchupData.bracket && matchupData.bracket.length > 0));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 animate-in fade-in duration-500">
      
      {/* Header Styled like History Page */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                 <Link href="/" className="text-xs font-medium text-slate-500 hover:text-slate-300 uppercase tracking-widest mb-2 inline-block transition-colors">
                   ← Voltar
                 </Link>
                 <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
                   Central de Confrontos
                 </h1>
                 <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span className={`w-2 h-2 rounded-full ${leagueType === 'redraft' ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`}></span>
                    <span className="font-semibold text-slate-300">{leagueName}</span>
                    <span className="text-slate-600">•</span>
                    <span>Temporada {leagueInfo?.season || '...'}</span>
                 </div>
              </div>

               {/* View Toggle */}
              <div className="bg-slate-900/50 p-1 rounded-lg border border-slate-800 flex shadow-inner">
                 <button
                   onClick={() => setViewMode('list')}
                   className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                     viewMode === 'list' 
                       ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' 
                       : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                   }`}
                 >
                   Lista
                 </button>
                 <button
                   onClick={() => setViewMode('bracket')}
                   disabled={selectedWeek < schedule.playoffs.start}
                   className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                     viewMode === 'bracket' 
                       ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' 
                       : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                   } ${selectedWeek < schedule.playoffs.start ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   Playoffs Bracket
                 </button>
              </div>
          </div>

          {/* Week Selector */}
          <div className="sticky top-4 z-30 mb-8">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl shadow-black/20 p-1 overflow-hidden">
                <div 
                  ref={weekSelectorRef}
                  className="flex overflow-x-auto scrollbar-hide py-2 px-2 gap-8 items-center"
                  style={{ scrollPaddingLeft: '50%' }}
                >
                    {/* Regular Season Group */}
                    <div className="flex flex-col shrink-0">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 px-2 border-l-2 border-slate-800">
                            Temporada Regular
                        </span>
                        <div className="flex gap-2">
                            {weeks.filter(w => w <= schedule.regular.end).map(week => {
                                const isCurrent = week === currentWeek;
                                const isSelected = week === selectedWeek;
                                const isPast = week < currentWeek;

                                return (
                                    <button
                                        key={week}
                                        onClick={() => { setSelectedWeek(week); setViewMode('list'); }}
                                        data-active={isSelected}
                                        className={`
                                            relative flex flex-col items-center justify-center w-14 h-14 rounded-lg border transition-all duration-200
                                            ${isSelected 
                                                ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-110 z-10' 
                                                : isPast
                                                     ? 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:bg-slate-800'
                                                     : 'border-slate-800 bg-slate-950 text-slate-600'
                                            }
                                        `}
                                    >
                                        <span className={`text-[10px] font-bold opacity-70 leading-none ${isSelected ? 'text-blue-200' : ''}`}>SEM</span>
                                        <span className={`text-lg font-bold leading-none mt-0.5 ${isSelected ? 'text-white' : ''}`}>{week}</span>
                                        {isCurrent && !isSelected && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-slate-900"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-12 bg-slate-800 shrink-0 mx-2"></div>

                    {/* Playoffs Group */}
                    <div className="flex flex-col shrink-0">
                         <span className="text-[10px] uppercase tracking-widest font-bold text-amber-500/60 mb-2 px-2 border-l-2 border-amber-900/30">
                            Playoffs & Finais
                        </span>
                        <div className="flex gap-2">
                             {weeks.filter(w => w >= schedule.playoffs.start).map(week => {
                                const isCurrent = week === currentWeek;
                                const isSelected = week === selectedWeek;
                                
                                return (
                                    <button
                                        key={week}
                                        onClick={() => { setSelectedWeek(week); }}
                                        data-active={isSelected}
                                        className={`
                                            relative flex flex-col items-center justify-center w-14 h-14 rounded-lg border transition-all duration-200
                                            ${isSelected 
                                                ? 'border-amber-500 bg-amber-600 text-white shadow-lg shadow-amber-900/50 scale-110 z-10' 
                                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-amber-900/50 hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        <TrophyIcon className={`w-3 h-3 mb-0.5 ${isSelected ? 'text-amber-200' : 'text-amber-500/50'}`} />
                                        <span className="text-lg font-bold leading-none">{week}</span>
                                        {isCurrent && !isSelected && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-slate-900"></span>
                                        )}
                                    </button>
                                );
                             })}
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-blue-500 animate-loading-bar"></div>
                </div>
                <p className="text-slate-500 mt-4 font-medium animate-pulse">Carregando dados da liga...</p>
             </div>
          ) : !hasMatchups ? (
             /* Empty State logic */
             <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-700">
                    <CalendarDaysIcon className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Confrontos ainda não gerados</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-8">
                   Parece que a tabela de jogos para a temporada {leagueInfo?.season} ainda não foi definida ou liberada pela plataforma.
                </p>
                
                {leagueInfo?.previousLeagueId && (
                    <Link 
                       href={`/matchups/${leagueInfo.previousLeagueId}`}
                       className="group flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-all ring-1 ring-white/10 hover:ring-white/20"
                    >
                       <ArrowPathIcon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                       Visualizar Temporada Anterior
                       <ChevronRightIcon className="w-4 h-4 ml-1 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
             </div>
          ) : (
             /* Data Display */
             <div className="animate-in slide-in-from-bottom-4 duration-500">
                
                {viewMode === 'list' && (
                    <>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                           <CalendarDaysIcon className="w-5 h-5 text-blue-500" />
                           Partidas da Semana {matchupData?.week}
                        </h2>
                        {/* Debug/Info Label */}
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-900 px-2 py-1 rounded border border-slate-800 uppercase tracking-wider">
                           Config: {matchupData?.rule}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {matchupData?.pairs.map((pair, index) => (
                            <MatchupCard 
                                key={`${pair.home.rosterId}-${pair.away.rosterId}-${index}`} 
                                pair={pair} 
                                index={index}
                                showStats={true}
                            />
                        ))}
                    </div>
                    </>
                )}

                {viewMode === 'bracket' && matchupData?.bracket && (
                     <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 overflow-x-auto min-h-[600px] shadow-inner">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <TrophyIcon className="w-6 h-6 text-amber-500" />
                            Bracket dos Playoffs
                        </h2>
                        <Bracket bracket={matchupData.bracket} />
                     </div>
                )}
             </div>
          )}

      </div>
    </div>
  );
}