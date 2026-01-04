'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getLeagueConfig } from '../../../lib/env-validation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface Team {
  rank: number;
  rosterId: number;
  ownerId: string;
  displayName: string;
  avatarUrl?: string; // Adicionado para suportar avatares
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface MatchupTeam extends Team {
  matchup_id?: number;
}

interface MatchupPair {
  home: MatchupTeam;
  away: MatchupTeam;
  status: 'scheduled' | 'in_progress' | 'final';
}

interface MatchupData {
  leagueId: string;
  week: number;
  rule: string;
  pairs: MatchupPair[];
}

interface StandingsData {
  leagueId: string;
  season: string;
  week: number;
  teams: Team[];
}

type TabType = 'official' | 'simulation';
type SimulationState = 'loading' | 'active' | 'error';

// Helper component for simulated inputs
const ScoreInput = ({ 
  value, 
  onChange, 
  originalValue 
}: { 
  value: number | undefined, 
  onChange: (val: string) => void,
  originalValue: number
}) => {
  return (
    <input
      type="number"
      step="0.01"
      className={`w-20 px-2 py-1 text-center rounded text-sm transition-all focus:ring-2 focus:ring-accent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none
        ${value !== undefined 
          ? 'bg-accent/10 border border-accent text-accent font-bold' 
          : 'bg-surface border border-border text-text'}`}
      placeholder={originalValue.toFixed(2)}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default function StandingsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  const [data, setData] = useState<StandingsData | null>(null);
  const [matchupsData, setMatchupsData] = useState<MatchupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('official');
  const [simulationState, setSimulationState] = useState<SimulationState>('loading');
  const [useSleeperDefault, setUseSleeperDefault] = useState(true);
  
  // Stores user overrides for scores. Key: rosterId, Value: overridden score
  const [userOverrides, setUserOverrides] = useState<Record<number, number>>({});

  // Função para buscar Standings
  const fetchStandings = useCallback(async (isBackgroundUpdate = false) => {
    try {
      if (!isBackgroundUpdate) {
        setLoading(true);
        setError(null);
      }
      
      const sortType = useSleeperDefault ? 'sleeper' : 'points-race';
      const response = await fetch(`/api/standings?league=${leagueId}&sort=${sortType}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar standings');
      }
      
      const standingsData = await response.json();
      
      if (!isBackgroundUpdate) {
        setData(standingsData);
      } else {
        // Atualização em background: Preservar estrutura mas atualizar dados
        setData(prev => {
          if (!prev) return standingsData;
          return {
            ...standingsData,
            ...prev, // Keep prev state if needed, here just updating is fine
            teams: standingsData.teams
          };
        });
      }
    } catch (err) {
      if (!isBackgroundUpdate) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } else {
        console.error('Erro na atualização em background dos standings:', err);
      }
    } finally {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    }
  }, [leagueId, useSleeperDefault]);

  // Função para buscar Matchups
  const fetchMatchups = useCallback(async (currentWeek: number) => {
    try {
      // Se não temos dados, mudamos loading state
      if (!matchupsData) setSimulationState('loading');
      
      const response = await fetch(`/api/matchups?league=${leagueId}&week=${currentWeek}`);
      
      if (!response.ok) throw new Error('Falha ao carregar matchups');
      
      const matchups = await response.json();
      setMatchupsData(matchups);
      setSimulationState('active');
    } catch (err) {
      console.error(err);
      if (!matchupsData) setSimulationState('error');
    }
  }, [leagueId, matchupsData]);

  // Efeito inicial para carregar standings
  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  // Polling para simulação (Standings + Matchups)
  useEffect(() => {
    if (activeTab !== 'simulation' || !data?.week) return;

    // Carregar inicialmente
    fetchMatchups(data.week);

    // Configurar polling a cada 30s
    const interval = setInterval(() => {
      fetchStandings(true); // Atualiza pontos (background)
      fetchMatchups(data.week); // Atualiza placares dos jogos (background)
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab, data?.week, fetchMatchups, fetchStandings]);


  const simulatedStandings = useMemo(() => {
    if (!data || !matchupsData) return null;

    // 1. Criar mapa de times atuais para manipulação rápida
    const simTeams = data.teams.map(t => ({ ...t, originalRank: t.rank }));
    
    // 2. Aplicar resultados dos matchups atuais E overrides
    matchupsData.pairs.forEach(pair => {
      const homeTeam = simTeams.find(t => t.rosterId === pair.home.rosterId);
      const awayTeam = simTeams.find(t => t.rosterId === pair.away.rosterId);

      if (homeTeam && awayTeam) {
        // Determine effective scores (Overview vs Actual)
        const homePointsLive = pair.home.pointsFor;
        const awayPointsLive = pair.away.pointsFor;

        const homePointsSim = userOverrides[pair.home.rosterId] ?? homePointsLive;
        const awayPointsSim = userOverrides[pair.away.rosterId] ?? awayPointsLive;

        // Apply new Total Points Logic
        // Projected = Current Total in Standings + Simulated Match Points
        // We assume 'data.teams.pointsFor' (from Rosters DB) does NOT yet include the live week's points.
        
        homeTeam.pointsFor = homeTeam.pointsFor + homePointsSim;
        awayTeam.pointsFor = awayTeam.pointsFor + awayPointsSim;

        // Projetar W/L baseado no placar SIMULADO
        if (homePointsSim > awayPointsSim) {
          homeTeam.wins += 1;
          awayTeam.losses += 1;
        } else if (awayPointsSim > homePointsSim) {
          awayTeam.wins += 1;
          homeTeam.losses += 1;
        } else {
          // Empate
          if (homePointsSim > 0 || userOverrides[pair.home.rosterId] !== undefined) { 
             // Consider ties if points > 0 OR if user explicitly set a score (even 0)
             homeTeam.ties += 1;
             awayTeam.ties += 1;
          }
        }
      }
    });

    // 3. Recalcular Rankings com a regra específica Redraft
    const getWinPct = (t: Team) => (t.wins + t.losses + t.ties) > 0 
      ? (t.wins + 0.5 * t.ties) / (t.wins + t.losses + t.ties) 
      : 0;

    const standardSort = (a: Team, b: Team) => {
      const wpA = getWinPct(a);
      const wpB = getWinPct(b);
      if (wpA !== wpB) return wpB - wpA;
      if (a.pointsFor !== b.pointsFor) return b.pointsFor - a.pointsFor;
      return a.rosterId - b.rosterId;
    };

    const sortedAll = [...simTeams].sort(standardSort);
    
    // Identificar Top 6 (Standard Sort)
    const top6 = sortedAll.slice(0, 6);
    
    // Identificar Resto (Ordenado por Pontos)
    const remaining = sortedAll.slice(6);
    const remainingByPoints = remaining.sort((a, b) => b.pointsFor - a.pointsFor);

    // O 7º é automaticamente o líder do restante (que agora está ordenado por pontos)
    const finalOrder = [...top6, ...remainingByPoints];

    // Adicionar rank final e variação
    return finalOrder.map((team, index) => ({
      ...team,
      simulatedRank: index + 1,
      rankDiff: team.originalRank - (index + 1) // Positivo = Subiu, Negativo = Desceu
    }));
  }, [data, matchupsData, userOverrides]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[50vh] p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <h3 className="text-xl font-bold text-red-500 mb-2">Erro ao carregar dados</h3>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getLeagueName = (id: string) => {
    try {
      const leagueConfig = getLeagueConfig();
      if (id === leagueConfig.redraft) return 'TFL: Classic';
      if (id === leagueConfig.dynasty) return 'TFL: Dynasty';
      
      const historical = leagueConfig.historical;
      if (id === historical.redraft[2022]) return 'TFL: Classic 2022';
      if (id === historical.redraft[2023]) return 'TFL: Classic 2023';
      if (id === historical.redraft[2024]) return 'TFL: Classic 2024';
      if (id === historical.dynasty[2024]) return 'TFL: Dynasty 2024';
      
      return `Liga ${id.slice(-6)}`;
    } catch (error) {
      console.error('Erro ao obter nome da liga:', error);
      return `Liga ${id.slice(-6)}`;
    }
  };

  const getLeagueType = (id: string): 'redraft' | 'dynasty' => {
    try {
      const leagueConfig = getLeagueConfig();
      if (id === leagueConfig.redraft) return 'redraft';
      if (id === leagueConfig.dynasty) return 'dynasty';
      
      const historical = leagueConfig.historical;
      if (id === historical.redraft[2022] || id === historical.redraft[2023] || id === historical.redraft[2024]) return 'redraft';
      if (id === historical.dynasty[2024]) return 'dynasty';
      
      return 'redraft';
    } catch {
      return 'redraft';
    }
  };

  const getPlayoffConfig = (leagueType: 'redraft' | 'dynasty') => {
    if (leagueType === 'redraft') {
      return {
        totalSeeds: 7,
        byeSeeds: 1,
        description: 'Top 7: Classificados para os playoffs (1º lugar recebe bye)'
      };
    } else {
      return {
        totalSeeds: 6,
        byeSeeds: 2,
        description: 'Top 6: Classificados para os playoffs (1º e 2º lugares recebem bye)'
      };
    }
  };

  const leagueType = getLeagueType(data.leagueId);
  const playoffConfig = getPlayoffConfig(leagueType);

  // Flag para controlar visibilidade da aba de simulação
  const SIMULATION_ENABLED = false;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <Link 
            href="/" 
            className="group flex items-center text-text-muted hover:text-accent transition-colors mb-2 text-sm font-medium"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Voltar para o Inicio
          </Link>
          <div className="flex items-baseline gap-3">
             <h1 className="text-3xl font-bold text-text tracking-tight">
               {getLeagueName(data.leagueId)}
             </h1>
             <span className="text-sm px-2.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium border border-accent/20">
               Semana {data.week}
             </span>
          </div>
          <p className="text-text-muted mt-1">
             Temporada {data.season}
          </p>
        </div>
      </div>

      {leagueType === 'redraft' && SIMULATION_ENABLED && (
        <div className="mb-8 border-b border-border">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('official')}
              className={`
                whitespace-nowrap pb-4 px-2 border-b-2 font-medium text-sm transition-all
                ${activeTab === 'official'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text hover:border-border'}
              `}
            >
              Classificação Oficial
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`
                whitespace-nowrap pb-4 px-2 border-b-2 font-medium text-sm transition-all flex items-center gap-2
                ${activeTab === 'simulation'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text hover:border-border'}
              `}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Simulação Interativa
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'simulation' && leagueType === 'redraft' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Simulation Table (Takes 2/3 on LG) */}
          <div className="lg:col-span-2 space-y-6">
              {/* Info Box */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
               <div className="flex items-start gap-3 relative z-10">
                 <div className="mt-0.5 p-2 bg-blue-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                 </div>
                 <div>
                   <h4 className="text-blue-400 font-bold mb-1">Modo Simulação Interativo</h4>
                   <p className="text-sm text-blue-300/80 leading-relaxed">
                     Altere os placares na barra lateral para projetar a classificação final da rodada.
                     <br/>
                     <span className="text-blue-300/60 text-xs mt-1 block">
                       Cálculo: Pontos Totais Atuais + Placar Simulado da Semana.
                     </span>
                   </p>
                 </div>
               </div>
             </div>
  
             <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm relative">
               {simulationState === 'loading' && (
                  <div className="absolute inset-0 bg-surface/80 z-20 flex items-center justify-center backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
                  </div>
               )}
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-border">
                   <thead className="bg-surface-hover/50">
                     <tr>
                       <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-16">#</th>
                       <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Time</th>
                       <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Rec (Proj)</th>
                       <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">PF Total</th>
                       <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Dif 7º</th>
                       <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                     </tr>
                   </thead>
                   <tbody className="bg-surface divide-y divide-border">
                     {simulatedStandings?.map((team) => {
                       const isPlayoffSeed = team.simulatedRank <= playoffConfig.totalSeeds;
                       const isByeSeed = team.simulatedRank <= playoffConfig.byeSeeds;
                       const isSeventhSeed = team.simulatedRank === 7;
                       const rankDiff = team.rankDiff || 0;
  
                       let rowClass = 'hover:bg-surface-hover transition-colors group';
                       if (isByeSeed) rowClass += ' bg-green-500/5 hover:bg-green-500/10';
                       else if (isPlayoffSeed) rowClass += ' bg-accent/5 hover:bg-accent/10';
                       
                       // Cálculo de Diferença de Pontos para o 7º lugar
                       let pointsDiffDisplay = '-';
                       if (simulatedStandings.length >= 7) {
                         const seventhPlacePoints = simulatedStandings[6]?.pointsFor || 0;
                         if (team.simulatedRank === 7) {
                           pointsDiffDisplay = 'Líder';
                         } else if (team.simulatedRank > 7) {
                            const diff = seventhPlacePoints - team.pointsFor;
                            pointsDiffDisplay = `-${diff.toFixed(1)}`;
                         }
                       }
  
                       return (
                         <tr key={team.rosterId} className={rowClass}>
                           <td className="px-4 py-4 whitespace-nowrap text-center">
                             <div className="flex flex-col items-center justify-center">
                               <span className={`text-sm font-bold ${isByeSeed ? 'text-green-500' : isPlayoffSeed ? 'text-accent' : 'text-text-muted'}`}>
                                 {team.simulatedRank}
                               </span>
                               {rankDiff !== 0 && (
                                 <span className={`text-[10px] font-bold ${rankDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                   {rankDiff > 0 ? '▲' : '▼'}{Math.abs(rankDiff)}
                                 </span>
                               )}
                             </div>
                           </td>
                           <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                 {team.avatarUrl ? (
                                   <Image 
                                     src={team.avatarUrl} 
                                     alt="" 
                                     width={32} 
                                     height={32} 
                                     className="w-8 h-8 rounded-full border border-border object-cover"
                                   />
                                 ) : (
                                   <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-xs font-bold text-text-muted border border-border">
                                     {team.displayName.charAt(0)}
                                   </div>
                                 )}
                                 <div className="flex flex-col">
                                   <span className={`text-sm font-semibold ${isPlayoffSeed ? 'text-text' : 'text-text-muted'}`}>
                                     {team.displayName}
                                   </span>
                                   {isSeventhSeed && (
                                     <span className="text-[10px] uppercase tracking-wide text-amber-500 font-bold">Wildcard Leader</span>
                                   )}
                                 </div>
                              </div>
                           </td>
                           <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-text font-medium">
                             {team.wins}-{team.losses}{team.ties > 0 && `-${team.ties}`}
                           </td>
                           <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-text font-bold">
                             {team.pointsFor.toFixed(1)}
                           </td>
                           <td className={`px-4 py-4 whitespace-nowrap text-center text-sm font-bold ${team.simulatedRank > 7 ? 'text-red-400' : 'text-green-500'}`}>
                             {pointsDiffDisplay}
                           </td>
                           <td className="px-4 py-4 whitespace-nowrap text-center">
                              {isByeSeed ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                  BYE
                                </span>
                              ) : isPlayoffSeed ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                                  PLAYOFFS
                                </span>
                              ) : (
                                <span className="text-text-muted text-xs">-</span>
                              )}
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             </div>
          </div>

          {/* Right Column: Matchup Controls (Takes 1/3 on LG) */}
          <div className="space-y-6">
             <div className="bg-surface rounded-xl border border-border p-5 sticky top-6 shadow-lg shadow-black/5">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-text flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                   Placares da Semana
                 </h3>
                 {Object.keys(userOverrides).length > 0 && (
                   <button 
                     onClick={() => setUserOverrides({})}
                     className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors uppercase tracking-wide"
                   >
                     Resetar
                   </button>
                 )}
               </div>
               
               <div className="space-y-3">
                 {matchupsData?.pairs.map((pair, idx) => (
                   <div key={idx} className="bg-surface-hover/30 rounded-lg p-3 border border-border transition-colors hover:border-accent/30">
                     <div className="flex flex-col gap-3">
                        {/* Home Team */}
                        <div className="flex items-center justify-between gap-3">
                           <div className="truncate flex-1 min-w-0">
                              <span className="text-sm font-medium text-text block truncate leading-tight" title={pair.home.displayName}>
                                {pair.home.displayName} 
                              </span>
                              <span className="text-[10px] text-text-muted uppercase tracking-wider">Casa</span>
                           </div>
                           <div className="flex flex-col items-end gap-1 shrink-0">
                             <ScoreInput 
                                value={userOverrides[pair.home.rosterId]}
                                originalValue={pair.home.pointsFor}
                                onChange={(val) => {
                                   const num = val === '' ? undefined : parseFloat(val);
                                   setUserOverrides(prev => {
                                      const next = { ...prev };
                                      if (num === undefined) delete next[pair.home.rosterId];
                                      else next[pair.home.rosterId] = num;
                                      return next;
                                   });
                                }}
                             />
                             <div className="text-[10px] text-text-muted font-mono">
                               {pair.home.pointsFor.toFixed(2)}
                             </div>
                           </div>
                        </div>

                        {/* VS Separator */}
                        <div className="flex items-center gap-3 opacity-50">
                           <div className="h-px bg-border flex-1"></div>
                           <span className="text-[10px] text-text-muted font-bold">VS</span>
                           <div className="h-px bg-border flex-1"></div>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between gap-3">
                           <div className="truncate flex-1 min-w-0">
                              <span className="text-sm font-medium text-text block truncate leading-tight" title={pair.away.displayName}>
                                {pair.away.displayName}
                              </span>
                              <span className="text-[10px] text-text-muted uppercase tracking-wider">Visitante</span>
                           </div>
                           <div className="flex flex-col items-end gap-1 shrink-0">
                             <ScoreInput 
                                value={userOverrides[pair.away.rosterId]}
                                originalValue={pair.away.pointsFor}
                                onChange={(val) => {
                                   const num = val === '' ? undefined : parseFloat(val);
                                   setUserOverrides(prev => {
                                      const next = { ...prev };
                                      if (num === undefined) delete next[pair.away.rosterId];
                                      else next[pair.away.rosterId] = num;
                                      return next;
                                   });
                                }}
                             />
                             <div className="text-[10px] text-text-muted font-mono">
                               {pair.away.pointsFor.toFixed(2)}
                             </div>
                           </div>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      ) : (
        /* Renderização padrão "Official Tab" */
        <>
        {/* Legenda dos playoffs */}
        <div className="mb-6 p-4 bg-surface rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-bold text-text mb-3 uppercase tracking-wide">Regras de Classificação</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
               <div className="mt-1 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px] shadow-accent/50 shrink-0"></div>
               <div>
                 <span className="font-semibold text-text block mb-0.5">Zona de Classificação</span>
                 <span className="text-text-muted text-xs leading-relaxed max-w-sm block">
                    {playoffConfig.description}
                 </span>
               </div>
            </div>
            {playoffConfig.byeSeeds > 0 && (
              <div className="flex items-start gap-3">
                 <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/50 shrink-0"></div>
                 <div>
                   <span className="font-semibold text-text block mb-0.5">Bye Week</span>
                   <span className="text-text-muted text-xs leading-relaxed max-w-sm block">
                     {playoffConfig.byeSeeds === 1 ? '1º lugar' : '1º e 2º lugares'} avançam direto para as semifinais.
                   </span>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Controles de Classificação - Apenas para ligas Redraft */}
        {leagueType === 'redraft' && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-surface p-4 rounded-xl border border-border">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-text">Modo de Visualização</h3>
              <p className="text-xs text-text-muted max-w-md">
                {useSleeperDefault 
                  ? 'Padrão oficial do Sleeper (W-L e PF como critério de desempate).' 
                  : 'Corrida pelos Pontos: Ordena não-classificados por PF (Regra Wildcard).'
                }
              </p>
            </div>
            <div className="flex p-1 bg-surface-hover rounded-lg border border-border">
              <button
                onClick={() => setUseSleeperDefault(true)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  useSleeperDefault
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Padrão
              </button>
              <button
                onClick={() => setUseSleeperDefault(false)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  !useSleeperDefault
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Corrida (PF)
              </button>
            </div>
          </div>
        )}

        {/* Tabela de Standings */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-surface-hover/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider w-16">
                    Pos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-24">
                    V
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-24">
                    D
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-24">
                    E
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-green-500 uppercase tracking-wider w-24">
                    PCT
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-32">
                    PF
                  </th>
                  {!useSleeperDefault && leagueType === 'redraft' && (
                    <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-32">
                      Dif (7º)
                    </th>
                  )}
                  <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-32">
                    PA
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {data.teams.map((team, index) => {
                  /* 
                    Como data.teams já está ordenado (seja por Sleeper ou PointsRace),
                    podemos usar o index + 1 como a posição visual.
                  */
                  const visualRank = index + 1;
                  const realRank = team.rank; // Seed oficial do Sleeper

                  const isFirst = visualRank === 1;
                  const isSecond = visualRank === 2;
                  const isThird = visualRank === 3;
                  
                  // Top 7 Highlight Logic
                  const isTop7 = visualRank <= 7;

                  // Seed checks
                  const isPlayoffSeed = realRank <= playoffConfig.totalSeeds;
                  const isByeSeed = realRank <= playoffConfig.byeSeeds;
                  
                  // Na "Corrida pelos Pontos", os 6 primeiros (classificados) ficam em cinza (apenas para Redraft)
                  const isQualifiedInPointsRace = !useSleeperDefault && leagueType === 'redraft' && realRank <= 6;
                  
                  // Linha da tabela
                  // Removida classe de borda/divider padrao. Adicionado highlight para Top 7.
                  let rowClasses = "group transition-all duration-200 border-none ";
                  
                  if (isQualifiedInPointsRace) {
                    rowClasses += "opacity-40 hover:opacity-50 grayscale";
                  } else if (isTop7) {
                     // Destaque para Top 7: Fundo sutil, borda esquerda de destaque
                     rowClasses += isFirst 
                        ? "bg-accent/10 hover:bg-accent/15 border-l-4 border-accent"
                        : "bg-surface-hover/30 hover:bg-surface-hover/50 border-l-4 border-accent/40";
                  } else {
                     rowClasses += "hover:bg-surface-hover border-l-4 border-transparent";
                  }
                  
                  // Calcular diferença para o líder da corrida (apenas para times não classificados em ligas Redraft)
                  let pointsDifference = 0;
                  if (!useSleeperDefault && leagueType === 'redraft' && realRank > 6) {
                    const raceLeader = data.teams[6]; // 7º elemento
                    if (raceLeader) {
                      pointsDifference = raceLeader.pointsFor - team.pointsFor;
                    }
                  }

                  // Calcular PCT
                  const totalGames = team.wins + team.losses + team.ties;
                  const pct = totalGames > 0 ? ((team.wins + (0.5 * team.ties)) / totalGames) * 100 : 0;
                  
                  return (
                    <tr key={team.rosterId} className={rowClasses}>
                      {/* POS */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isFirst ? (
                             <span className="w-8 h-8 flex items-center justify-center rounded bg-accent text-white font-bold text-sm shadow-md shadow-accent/20">
                               1
                             </span>
                          ) : (
                             <span className={`text-sm font-bold w-8 text-center ${
                                 isSecond ? 'text-slate-200' :
                                 isThird ? 'text-amber-600' :
                                 'text-text-muted'
                             }`}>
                               {visualRank}
                             </span>
                          )}
                        </div>
                      </td>

                      {/* TIME */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                           <div className="relative shrink-0">
                              {team.avatarUrl ? (
                                <Image 
                                  src={team.avatarUrl} 
                                  alt="" 
                                  width={40} 
                                  height={40} 
                                  className={`w-10 h-10 rounded-full object-cover border-2 transition-colors ${isTop7 ? 'border-accent/40' : 'border-border'}`}
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-text font-bold text-sm ${isTop7 ? 'bg-accent/10 border-accent/40' : 'bg-surface-hover border-border'}`}>
                                  {team.displayName.charAt(0)}
                                </div>
                              )}
                              {/* Status Badge Mini */}
                              {!isQualifiedInPointsRace && (isByeSeed || isPlayoffSeed) && (
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center ${isByeSeed ? 'bg-emerald-500' : 'bg-accent'}`}>
                                  {/* Color dot/Icon can go here */}
                                </div>
                              )}
                           </div>
                           <div className="flex flex-col">
                             <span className={`text-sm font-bold ${
                               isQualifiedInPointsRace ? 'text-text-muted' : 'text-text'
                             }`}>
                               {team.displayName}
                             </span>
                             {/* ID Removed */}
                           </div>
                        </div>
                      </td>

                      {/* V */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-text">
                        {team.wins}
                      </td>

                      {/* D */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-text-muted">
                        {team.losses}
                      </td>

                      {/* E */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-text-muted">
                        {team.ties > 0 ? team.ties : '-'}
                      </td>
                      
                      {/* PCT */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-emerald-500">
                        {pct.toFixed(0)}%
                      </td>

                      {/* PF */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-text">
                        {team.pointsFor.toFixed(1)}
                      </td>

                      {/* Diferença (Points Race) */}
                      {!useSleeperDefault && leagueType === 'redraft' && (
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">
                          {visualRank > 6 ? (
                            <span className={pointsDifference === 0 ? 'text-emerald-500' : 'text-rose-500'}>
                              {pointsDifference === 0 ? 'Líder' : `-${pointsDifference.toFixed(1)}`}
                            </span>
                          ) : (
                            <span className="text-border">-</span>
                          )}
                        </td>
                      )}

                      {/* PA */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-text-muted">
                        {team.pointsAgainst.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Footer info */}
      <div className="mt-8 text-center border-t border-border pt-6">
        <p className="text-xs text-text-muted flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Atualizado automaticamente a cada 30 segundos
        </p>
      </div>
    </div>
  );
}