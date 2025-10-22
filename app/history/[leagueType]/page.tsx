'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon, TrophyIcon } from '@heroicons/react/24/outline';

// Interfaces para os dados
interface Champion {
  rosterId: number;
  displayName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  seed?: number;
}

interface Standing {
  rank: number;
  displayName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface SeasonData {
  year: string;
  leagueId: string;
  champion: Champion | null;
  runnerUp: Champion | null;
  standings: Standing[];
  bracket?: {
    finalRound: number;
  };
  note?: string; // Observação adicional para dados históricos
}

interface HistoryData {
  leagueType: string;
  seasons: SeasonData[];
}

export default function HistoryPage() {
  const params = useParams();
  const leagueType = params.leagueType as string;
  
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());

  // Validar leagueType
  const isValidLeagueType = ['redraft', 'dynasty'].includes(leagueType);

  useEffect(() => {
    if (!isValidLeagueType) {
      setError('Tipo de liga inválido');
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/history?leagueType=${leagueType}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar histórico');
        }
        
        const data: HistoryData = await response.json();
        
        // Debug: Verificar dados recebidos da API
        console.log('=== DEBUG: Dados da API ===');
        console.log('Tipo de liga:', leagueType);
        console.log('Dados completos:', data);
        
        if (data.seasons && data.seasons.length > 0) {
          console.log('Total de temporadas:', data.seasons.length);
          const firstSeason = data.seasons[0];
          console.log('Primeira temporada:', firstSeason.year);
          
          if (firstSeason.standings && firstSeason.standings.length > 0) {
            console.log('Total de times na primeira temporada:', firstSeason.standings.length);
            console.log('Primeiros 5 times:');
            firstSeason.standings.slice(0, 5).forEach((team, index) => {
              console.log(`  ${index + 1}. ${team.displayName} (rank: ${team.rank})`);
            });
          }
          
          if (firstSeason.champion) {
            console.log('Campeão:', firstSeason.champion.displayName);
          }
        }
        console.log('=== FIM DEBUG ===');
        
        setHistoryData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [leagueType, isValidLeagueType]);

  const toggleSeasonExpansion = (year: string) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedSeasons(newExpanded);
  };

  const getLeagueDisplayName = (type: string) => {
    return type === 'redraft' ? 'Redraft League' : 'Dynasty League';
  };

  const getLeagueGradient = (type: string) => {
    return type === 'redraft' ? 'from-accent to-accent-hover' : 'from-green-500 to-green-600';
  };

  if (!isValidLeagueType) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-text mb-4">Tipo de Liga Inválido</h1>
            <p className="text-text-muted mb-6">O tipo de liga deve ser &quot;redraft&quot; ou &quot;dynasty&quot;.</p>
            <Link
              href="/"
              className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-muted">Carregando histórico...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-text mb-4">Erro</h1>
            <p className="text-text-muted mb-6">{error}</p>
            <Link
              href="/"
              className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!historyData || historyData.seasons.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-text mb-4">Sem Dados Históricos</h1>
            <p className="text-text-muted mb-6">
              Não há dados históricos disponíveis para {getLeagueDisplayName(leagueType)}.
            </p>
            <Link
              href="/"
              className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <h1 className="text-3xl font-bold text-text mb-2">
              Histórico - {getLeagueDisplayName(leagueType)}
            </h1>
            <p className="text-text-muted">
              Hall de campeões e classificações finais por temporada
            </p>
          </div>

      {/* Hall de Campeões */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text flex items-center gap-2">
          <TrophyIcon className="h-6 w-6 text-yellow-500" />
          Hall de Campeões
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {historyData.seasons.map((season) => (
            <div
              key={season.year}
              className={`bg-gradient-to-br ${getLeagueGradient(leagueType)} text-white rounded-lg p-6 border border-border-muted shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">{season.year}</h3>
                <div className="flex items-center gap-1">
                  {season.bracket ? (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded text-white/90">
                      Playoffs
                    </span>
                  ) : (
                    <span className="text-xs bg-orange-500/80 px-2 py-1 rounded text-white">
                      Standings
                    </span>
                  )}
                  <TrophyIcon className="h-6 w-6 text-yellow-300" />
                </div>
              </div>
              
              {season.champion ? (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🏆</span>
                    <p className="text-white/90 text-sm">Campeão do {season.bracket ? 'Playoff' : 'Standing'}</p>
                  </div>
                  <p className="font-bold text-lg mb-2">{season.champion.displayName}</p>
                  <div className="text-white/80 text-sm space-y-1">
                    <p>Record: {season.champion.wins}-{season.champion.losses}-{season.champion.ties}</p>
                    <p>Pontos: {season.champion.pointsFor.toFixed(1)}</p>
                    {season.champion.seed && (
                      <p>Seed: #{season.champion.seed}</p>
                    )}
                  </div>
                  
                  {season.runnerUp && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🥈</span>
                        <p className="text-white/70 text-xs">Vice-campeão</p>
                      </div>
                      <p className="text-white/90 font-medium">{season.runnerUp.displayName}</p>
                      {season.runnerUp.seed && (
                        <p className="text-white/70 text-xs mt-1">Seed: #{season.runnerUp.seed}</p>
                      )}
                    </div>
                  )}
                  
                  {!season.bracket && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-white/60 text-xs">
                        ⚠️ Playoffs não encontrados para esta temporada
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-white/80 mb-2">Dados não disponíveis</p>
                  {!season.bracket && (
                    <p className="text-white/60 text-xs">
                      ⚠️ Playoffs não encontrados para esta temporada
                    </p>
                  )}
                </div>
              )}
              
              {/* Exibir observação se existir */}
              {season.note && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-white/70 text-xs italic">
                    📝 {season.note}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Classificações por Temporada */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text">
          Classificações Finais
        </h2>
        
        <div className="space-y-4">
          {historyData.seasons.map((season) => {
            const isExpanded = expandedSeasons.has(season.year);
            
            return (
              <div key={season.year} className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Header da temporada */}
                <button
                  onClick={() => toggleSeasonExpansion(season.year)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-text">Temporada {season.year}</h3>
                    {season.champion && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🏆</span>
                        <span className="text-sm text-text-muted">
                          Campeão: {season.champion.displayName}
                        </span>
                        {season.bracket && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                            Playoffs
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-text-muted" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-text-muted" />
                  )}
                </button>
                
                {/* Tabela de classificação */}
                {isExpanded && (
                  <div className="border-t border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-card-hover">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">#</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Time</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">V</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">D</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">E</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">PF</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-text-muted">PA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {season.standings.map((team) => (
                            <tr
                              key={`${season.year}-${team.rank}`}
                              className={`border-t border-border ${
                                // Destacar campeão e vice pelos playoffs, não pelo standing
                                season.champion && team.displayName === season.champion.displayName ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                                season.runnerUp && team.displayName === season.runnerUp.displayName ? 'bg-gray-50 dark:bg-gray-800/50' :
                                'hover:bg-card-hover'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-text">{team.rank}</span>
                                  {season.champion && team.displayName === season.champion.displayName && (
                                    <span className="text-sm" title="Campeão dos Playoffs">🏆</span>
                                  )}
                                  {season.runnerUp && team.displayName === season.runnerUp.displayName && (
                                    <span className="text-sm" title="Vice-campeão dos Playoffs">🥈</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-text">{team.displayName || `Time ${team.rank}` || 'Nome não disponível'}</span>
                                  {season.champion && team.displayName === season.champion.displayName && season.champion.seed && (
                                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-1 py-0.5 rounded">
                                      Seed #{season.champion.seed}
                                    </span>
                                  )}
                                  {season.runnerUp && team.displayName === season.runnerUp.displayName && season.runnerUp.seed && (
                                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1 py-0.5 rounded">
                                      Seed #{season.runnerUp.seed}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-text">{team.wins}</td>
                              <td className="px-4 py-3 text-center text-sm text-text">{team.losses}</td>
                              <td className="px-4 py-3 text-center text-sm text-text">{team.ties}</td>
                              <td className="px-4 py-3 text-center text-sm text-text">{team.pointsFor.toFixed(1)}</td>
                              <td className="px-4 py-3 text-center text-sm text-text">{team.pointsAgainst.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

          {/* Botão de voltar */}
          <div className="text-center pt-8">
            <Link
              href="/"
              className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}