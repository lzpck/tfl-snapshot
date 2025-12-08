'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getLeagueConfig } from '../../../lib/env-validation';

interface Team {
  rank: number;
  rosterId: number;
  ownerId: string;
  displayName: string;
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
      className={`w-20 px-2 py-1 text-center rounded border text-sm transition-all focus:ring-2 focus:ring-accent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none
        ${value !== undefined 
          ? 'bg-accent/10 border-accent text-accent font-bold' 
          : 'bg-surface border-border text-text'}`}
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
        // Projected = (Current Total in Standings - Live Match Points) + Simulated Match Points
        // Note: Assuming 'data.teams' is reasonably up to date with 'pair.pointsFor'. 
        // If data.teams.pointsFor lags behind, this diff might be slightly off, but usually it's correct.
        
        homeTeam.pointsFor = (homeTeam.pointsFor - homePointsLive) + homePointsSim;
        awayTeam.pointsFor = (awayTeam.pointsFor - awayPointsLive) + awayPointsSim;

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
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Nenhum dado encontrado</p>
      </div>
    );
  }

  const getLeagueName = (id: string) => {
    try {
      const leagueConfig = getLeagueConfig();
      if (id === leagueConfig.redraft) return 'Redraft League';
      if (id === leagueConfig.dynasty) return 'Dynasty League';
      
      const historical = leagueConfig.historical;
      if (id === historical.redraft[2022]) return 'Redraft League 2022';
      if (id === historical.redraft[2023]) return 'Redraft League 2023';
      if (id === historical.redraft[2024]) return 'Redraft League 2024';
      if (id === historical.dynasty[2024]) return 'Dynasty League 2024';
      
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
    } catch (error) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h2 className="text-2xl font-bold text-text">
            {getLeagueName(data.leagueId)}
          </h2>
          <p className="text-text-muted">
            Temporada {data.season} • Semana {data.week}
          </p>
        </div>
      </div>

      {leagueType === 'redraft' && (
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('official')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
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
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                ${activeTab === 'simulation'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text hover:border-border'}
              `}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Simulação em Tempo Real
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'simulation' && leagueType === 'redraft' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Simulation Table (Takes 2/3 on LG) */}
          <div className="lg:col-span-2 space-y-4">
              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
               <div className="flex items-start gap-3">
                 <div className="mt-1">
                   <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                 </div>
                 <div>
                   <h4 className="text-blue-400 font-medium">Modo Simulação Interativo</h4>
                   <p className="text-sm text-blue-300/80 mt-1">
                     Altere os placares nos confrontos ao lado para simular cenários. 
                     A tabela atualizará automaticamente. 
                     Valores destacados indicam edição manual.
                   </p>
                 </div>
               </div>
             </div>
  
             <div className="bg-surface rounded-lg border border-border overflow-hidden relative">
               {simulationState === 'loading' && (
                  <div className="absolute inset-0 bg-surface/80 z-20 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
               )}
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-border">
                   <thead className="bg-surface-hover sticky top-0 z-10">
                     <tr>
                       <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"># (Proj)</th>
                       <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Time</th>
                       <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">W-L-T (Proj)</th>
                       <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">PF (Total)</th>
                       <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">Dif. 7º</th>
                       <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                     </tr>
                   </thead>
                   <tbody className="bg-surface divide-y divide-border">
                     {simulatedStandings?.map((team) => {
                       const isPlayoffSeed = team.simulatedRank <= playoffConfig.totalSeeds;
                       const isByeSeed = team.simulatedRank <= playoffConfig.byeSeeds;
                       const isSeventhSeed = team.simulatedRank === 7;
                       const rankDiff = team.rankDiff || 0;
  
                       let rowClass = 'hover:bg-surface-hover transition-colors';
                       if (isByeSeed) rowClass = 'bg-green-500/10 hover:bg-green-500/20 border-l-4 border-green-400';
                       else if (isPlayoffSeed) rowClass = 'bg-accent/10 hover:bg-accent/20 border-l-4 border-accent';
                       
                       // Cálculo de Diferença de Pontos para o 7º lugar
                       let pointsDiffDisplay = '-';
                       if (simulatedStandings.length >= 7) {
                         const seventhPlacePoints = simulatedStandings[6]?.pointsFor || 0;
                         if (team.simulatedRank === 7) {
                           pointsDiffDisplay = 'Líder (WC)';
                         } else if (team.simulatedRank > 7) {
                            const diff = seventhPlacePoints - team.pointsFor;
                            pointsDiffDisplay = `-${diff.toFixed(1)}`;
                         }
                       }
  
                       return (
                         <tr key={team.rosterId} className={rowClass}>
                           <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-text">
                             <div className="flex items-center gap-2">
                               <span>{team.simulatedRank}</span>
                               {rankDiff !== 0 && (
                                 <span className={`text-xs flex items-center ${rankDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                   {rankDiff > 0 ? '▲' : '▼'} {Math.abs(rankDiff)}
                                 </span>
                               )}
                             </div>
                           </td>
                           <td className="px-3 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                 <span className={`text-sm font-medium ${isPlayoffSeed ? 'text-text' : 'text-text-muted'}`}>
                                   {team.displayName}
                                 </span>
                                 {isSeventhSeed && (
                                   <span className="text-xs text-yellow-500 font-medium">Wildcard Pontos</span>
                                 )}
                              </div>
                           </td>
                           <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-text">
                             {team.wins}-{team.losses}{team.ties > 0 && `-${team.ties}`}
                           </td>
                           <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-text font-bold">
                             {team.pointsFor.toFixed(1)}
                           </td>
                           <td className={`px-3 py-4 whitespace-nowrap text-center text-sm font-medium ${team.simulatedRank > 7 ? 'text-red-400' : 'text-green-400'}`}>
                             {pointsDiffDisplay}
                           </td>
                           <td className="px-3 py-4 whitespace-nowrap text-center text-sm">
                              {isByeSeed ? (
                                <span className="text-green-400 font-bold text-xs">BYE</span>
                              ) : isPlayoffSeed ? (
                                <span className="text-accent font-bold text-xs">PLAYOFFS</span>
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
          <div className="space-y-4">
             <div className="bg-surface rounded-lg border border-border p-4 sticky top-4">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold text-text">Confrontos da Semana</h3>
                 {Object.keys(userOverrides).length > 0 && (
                   <button 
                     onClick={() => setUserOverrides({})}
                     className="text-xs text-red-400 hover:text-red-300 underline"
                   >
                     Resetar Tudo
                   </button>
                 )}
               </div>
               
               <div className="space-y-4">
                 {matchupsData?.pairs.map((pair, idx) => (
                   <div key={idx} className="bg-surface-hover/50 rounded p-3 border border-border/50">
                     <div className="flex flex-col gap-3">
                        {/* Home Team */}
                        <div className="flex items-center justify-between gap-2">
                           <div className="truncate flex-1">
                              <span className="text-sm font-medium text-text block truncate" title={pair.home.displayName}>
                                {pair.home.displayName} 
                              </span>
                              <span className="text-xs text-text-muted">Casa</span>
                           </div>
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
                        </div>

                        {/* VS Separator */}
                        <div className="flex items-center gap-2">
                           <div className="h-px bg-border flex-1"></div>
                           <span className="text-xs text-text-muted font-bold">VS</span>
                           <div className="h-px bg-border flex-1"></div>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between gap-2">
                           <div className="truncate flex-1">
                              <span className="text-sm font-medium text-text block truncate" title={pair.away.displayName}>
                                {pair.away.displayName}
                              </span>
                              <span className="text-xs text-text-muted">Visitante</span>
                           </div>
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
        <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-accent/30">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-accent/20 rounded"></div>
              <span className="text-accent font-medium">{playoffConfig.description}</span>
            </div>
            {playoffConfig.byeSeeds > 0 && (
              <div className="flex items-center gap-1 ml-4">
                <div className="w-3 h-3 bg-green-400/20 rounded"></div>
                <span className="text-green-400 font-medium">
                  {playoffConfig.byeSeeds === 1 ? '1º lugar' : '1º e 2º lugares'}: Bye na primeira rodada
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controles de Classificação - Apenas para ligas Redraft */}
        {leagueType === 'redraft' && (
          <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-text">Tipo de Classificação</h3>
              <p className="text-sm text-text-muted">
                {useSleeperDefault 
                  ? 'Exibindo classificação no formato padrão do Sleeper' 
                  : 'Exibindo "Corrida pelos Pontos" - Times classificados destacados em cinza, demais ordenados por pontos'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUseSleeperDefault(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  useSleeperDefault
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-surface-hover text-text-muted hover:text-text hover:bg-surface border border-border'
                }`}
              >
                Classificação Padrão
              </button>
              <button
                onClick={() => setUseSleeperDefault(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !useSleeperDefault
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-surface-hover text-text-muted hover:text-text hover:bg-surface border border-border'
                }`}
              >
                Corrida pelos Pontos
              </button>
            </div>
          </div>
        )}

        {/* Tabela de Standings */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-hover sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-hover">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-hover">
                    Time
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-hover">
                    W-L-T
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-hover">
                    PCT
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-hover">
                    PF
                  </th>
                  {!useSleeperDefault && leagueType === 'redraft' && (
                    <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-hover">
                      Diferença
                    </th>
                  )}
                  <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-hover">
                    PA
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {data.teams.map((team) => {
                  // Destaca os times classificados para os playoffs
                  const isPlayoffSeed = team.rank <= playoffConfig.totalSeeds;
                  const isByeSeed = team.rank <= playoffConfig.byeSeeds;
                  
                  // Na "Corrida pelos Pontos", os 6 primeiros (classificados) ficam em cinza (apenas para Redraft)
                  const isQualifiedInPointsRace = !useSleeperDefault && leagueType === 'redraft' && team.rank <= 6;
                  
                  const rowClasses = isQualifiedInPointsRace
                    ? 'bg-gray-500/10 hover:bg-gray-500/20 border-l-4 border-gray-400 transition-colors opacity-60'
                    : isPlayoffSeed 
                      ? isByeSeed
                        ? 'bg-green-500/10 hover:bg-green-500/20 border-l-4 border-green-400 transition-colors'
                        : 'bg-accent/10 hover:bg-accent/20 border-l-4 border-accent transition-colors'
                      : 'hover:bg-surface-hover transition-colors';
                  
                  // Calcular diferença para o líder da corrida (apenas para times não classificados em ligas Redraft)
                  let pointsDifference = 0;
                  if (!useSleeperDefault && leagueType === 'redraft' && team.rank > 6) {
                    // Encontrar o líder da corrida (7º colocado - primeiro dos não classificados)
                    const raceLeader = data.teams.find(t => t.rank === 7);
                    if (raceLeader) {
                      pointsDifference = raceLeader.pointsFor - team.pointsFor;
                    }
                  }
                  
                  return (
                    <tr key={team.rosterId} className={rowClasses}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-text">
                        <div className="flex items-center gap-2">
                          {team.rank}
                          {!isQualifiedInPointsRace && isByeSeed && (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-400 text-background text-xs font-bold rounded-full">
                              B
                            </span>
                          )}
                          {!isQualifiedInPointsRace && isPlayoffSeed && !isByeSeed && (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-accent text-background text-xs font-bold rounded-full">
                              P
                            </span>
                          )}
                          {isQualifiedInPointsRace && (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-400 text-background text-xs font-bold rounded-full">
                              Q
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          isQualifiedInPointsRace 
                            ? 'text-gray-400' 
                            : isByeSeed 
                              ? 'text-green-400' 
                              : isPlayoffSeed 
                                ? 'text-accent' 
                                : 'text-text'
                        }`} title={team.displayName || 'Nome não disponível'}>
                          {team.displayName || `Time ${team.rosterId}` || 'Nome não disponível'}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-text">
                        {team.wins}-{team.losses}{team.ties > 0 && `-${team.ties}`}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-text font-medium">
                        {(() => {
                          const totalGames = team.wins + team.losses + team.ties;
                          const winPercentage = totalGames > 0 ? (team.wins / totalGames) : 0;
                          return winPercentage.toFixed(3);
                        })()}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-text">
                        {team.pointsFor ? team.pointsFor.toFixed(1) : '0.0'}
                      </td>
                      {!useSleeperDefault && leagueType === 'redraft' && (
                        <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-text">
                          {team.rank > 6 ? (
                            <span className={`font-medium ${pointsDifference === 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pointsDifference === 0 ? 'Líder' : `-${pointsDifference.toFixed(1)}`}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-text">
                        {team.pointsAgainst ? team.pointsAgainst.toFixed(1) : '0.0'}
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
      <div className="text-center text-sm text-gray-500">
        <p>Dados atualizados automaticamente a cada 60 segundos</p>
      </div>
    </div>
  );
}