'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
  streak: string;
}

interface StandingsData {
  leagueId: string;
  season: string;
  week: number;
  teams: Team[];
}

export default function StandingsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useSleeperDefault, setUseSleeperDefault] = useState(true); // Estado para controlar qual classificação usar

  useEffect(() => {
    let isMounted = true;
    
    async function fetchStandings() {
      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        
        // Adicionar parâmetro para indicar qual tipo de classificação usar
        const sortType = useSleeperDefault ? 'sleeper' : 'points-race';
        const response = await fetch(`/api/standings?league=${leagueId}&sort=${sortType}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar standings');
        }
        
        const standingsData = await response.json();
        
        // Debug: Verificar dados recebidos da API de standings
        console.log('=== DEBUG STANDINGS ===');
        console.log('League ID:', leagueId);
        console.log('Sort Type:', sortType);
        console.log('Dados completos:', standingsData);
        
        if (standingsData.teams && standingsData.teams.length > 0) {
          console.log('Total de times:', standingsData.teams.length);
          console.log('Primeiros 5 times:');
          standingsData.teams.slice(0, 5).forEach((team: Team, index: number) => {
            console.log(`  ${index + 1}. ${team.displayName} (rank: ${team.rank}, rosterId: ${team.rosterId})`);
          });
        }
        console.log('=== FIM DEBUG STANDINGS ===');
        
        if (isMounted) {
          setData(standingsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (leagueId) {
      fetchStandings();
    }
    
    return () => {
      isMounted = false;
    };
  }, [leagueId, useSleeperDefault]); // Adicionar useSleeperDefault como dependência

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
    if (id === '1180180342143975424') return 'Redraft League';
    if (id === '1180180565689552896') return 'Dynasty League';
    return 'Liga';
  };

  const getLeagueType = (id: string): 'redraft' | 'dynasty' => {
    if (id === '1180180342143975424') return 'redraft';
    if (id === '1180180565689552896') return 'dynasty';
    return 'redraft';
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

      {/* Controles de Classificação */}
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
                {!useSleeperDefault && (
                  <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-hover">
                    Diferença
                  </th>
                )}
                <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-hover">
                  PA
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider bg-surface-hover">
                  Streak
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {data.teams.map((team) => {
                // Destaca os times classificados para os playoffs
                const isPlayoffSeed = team.rank <= playoffConfig.totalSeeds;
                const isByeSeed = team.rank <= playoffConfig.byeSeeds;
                
                // Na "Corrida pelos Pontos", os 6 primeiros (classificados) ficam em cinza
                const isQualifiedInPointsRace = !useSleeperDefault && team.rank <= 6;
                
                const rowClasses = isQualifiedInPointsRace
                  ? 'bg-gray-500/10 hover:bg-gray-500/20 border-l-4 border-gray-400 transition-colors opacity-60'
                  : isPlayoffSeed 
                    ? isByeSeed
                      ? 'bg-green-500/10 hover:bg-green-500/20 border-l-4 border-green-400 transition-colors'
                      : 'bg-accent/10 hover:bg-accent/20 border-l-4 border-accent transition-colors'
                    : 'hover:bg-surface-hover transition-colors';
                
                // Calcular diferença para o líder da corrida (apenas para times não classificados)
                let pointsDifference = 0;
                if (!useSleeperDefault && team.rank > 6) {
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
                      }`}>
                        {team.displayName}
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
                    {!useSleeperDefault && (
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
                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        team.streak.startsWith('W') 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : team.streak.startsWith('L')
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-surface-hover text-text-muted border border-border'
                      }`}>
                        {team.streak}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-sm text-gray-500">
        <p>Dados atualizados automaticamente a cada 60 segundos</p>
      </div>
    </div>
  );
}