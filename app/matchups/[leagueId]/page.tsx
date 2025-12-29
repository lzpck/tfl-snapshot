'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MatchupView } from '@/lib/matchups';
import MatchupCard from '@/app/components/MatchupCard';
import Bracket from '@/app/components/Bracket';
import { getLeagueConfig } from '@/lib/env-validation';

export default function MatchupsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  // Obter configurações das ligas
  const leagueConfig = getLeagueConfig();
  
  const [matchupData, setMatchupData] = useState<MatchupView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(14);
  const [viewMode, setViewMode] = useState<'list' | 'bracket'>('list');
  
  // Determinar tipo de liga e semanas válidas
  const leagueTypeConfig = useMemo(() => {
    const leagueType = leagueId === leagueConfig.redraft ? 'redraft' : 'dynasty';
    const leagueName = leagueType === 'redraft' ? 'TFL Redraft' : 'TFL Dynasty';
    // Redraft agora tem playoffs 15-17 validos
    const validWeeks = leagueType === 'redraft' ? [14, 15, 16, 17] : [10, 11, 12, 13, 14, 15, 16, 17];
    return { leagueType, leagueName, validWeeks };
  }, [leagueId, leagueConfig]);
  
  const { leagueType, leagueName, validWeeks } = leagueTypeConfig;
  
  // Definir semana inicial
  useEffect(() => {
    if (leagueType === 'dynasty') {
      setSelectedWeek(14); // Semana inicial para Dynasty Playoffs
      setViewMode('bracket'); // Default to bracket for dynasty playoffs start
    } else {
        // Redraft
        setViewMode('list'); 
    }
  }, [leagueType]);

  // Buscar dados dos confrontos
  useEffect(() => {
    let isCancelled = false;
    
    const fetchMatchups = async () => {
      // Evitar múltiplas requisições simultâneas
      if (!leagueId || !validWeeks.includes(selectedWeek)) {
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        let url = `/api/matchups?league=${leagueId}&week=${selectedWeek}`;
        if (viewMode === 'bracket') {
            url += '&view=bracket';
        }

        const response = await fetch(url);
        
        if (isCancelled) return;
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao buscar confrontos');
        }
        
        const data: MatchupView = await response.json();
        
        if (!isCancelled) {
          setMatchupData(data);
          // Se recebemos um bracket e estamos no modo bracket, ótimo.
          // Se recebemos um bracket mas estamos no modo lista (ex: API forçou bracket), atualizamos?
          // Não, a API respeita o view param ou regra.
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
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
  }, [leagueId, selectedWeek, validWeeks, viewMode]);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
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
            <h1 className="text-3xl font-bold text-text mb-2">
              Preview de Confrontos
            </h1>
            <p className="text-lg text-text-muted">
              {leagueName}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-accent text-white' : 'bg-surface text-text hover:bg-surface-hover'}`}
              >
                Lista
              </button>
              <button 
                onClick={() => setViewMode('bracket')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'bracket' ? 'bg-accent text-white' : 'bg-surface text-text hover:bg-surface-hover'}`}
              >
                Bracket
              </button>
          </div>
        </div>

        {/* Seletor de semana - Fixo no topo */}
        {/* Só mostrar seletor de semana no modo LISTA ou se quiser filtrar bracket (mas bracket é full view) */}
        {viewMode === 'list' && (
          <div className="sticky top-16 z-40 bg-background border-b border-border pb-4 mb-6">
            <div className="bg-surface rounded-lg border border-border p-4">
              <label className="block text-sm font-medium text-text mb-3">
                Selecionar Semana:
              </label>
              <div className="flex flex-wrap gap-2">
                {validWeeks.map(week => (
                  <button
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedWeek === week
                        ? 'bg-accent text-background shadow-md'
                        : 'bg-surface text-text border border-border hover:bg-surface-hover'
                    }`}
                  >
                    Semana {week}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo principal */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <p className="mt-2 text-text-muted">Carregando confrontos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 mb-6">
            <h3 className="text-sm font-medium text-red-400">Erro ao carregar confrontos</h3>
            <p className="mt-1 text-sm text-red-300">{error}</p>
          </div>
        )}

        {matchupData && !loading && (
          <div>
            {/* Modo Bracket */}
            {viewMode === 'bracket' && matchupData.bracket && (
                <div className="overflow-x-auto">
                    <Bracket bracket={matchupData.bracket} />
                </div>
            )}
            
            {/* Aviso se modo bracket mas sem dados */}
            {viewMode === 'bracket' && !matchupData.bracket && (
                 <div className="text-center py-8 text-text-muted">
                    Sem dados de bracket disponíveis para esta visualização.
                 </div>
            )}

            {/* Modo Lista */}
            {viewMode === 'list' && (
                <>
                {/* Info da semana e regra */}
                <div className="bg-accent/10 border border-accent/30 rounded-md p-4 mb-6">
                  <h2 className="text-lg font-semibold text-accent mb-1">
                    Semana {matchupData.week} - {leagueName}
                  </h2>
                  <p className="text-sm text-accent/80">
                    Regra: {matchupData.rule}
                  </p>
                </div>

                {matchupData.pairs.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 auto-rows-fr">
                      {matchupData.pairs.map((pair, index) => (
                        <MatchupCard 
                          key={`${pair.home.rosterId}-${pair.away.rosterId}`} 
                          pair={pair} 
                          index={index}
                          showStats={true}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-text-muted">Não há confrontos disponíveis para esta semana.</p>
                  </div>
                )}
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}