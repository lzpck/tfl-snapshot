'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { MatchupView } from '@/lib/matchups';
import MatchupCard from '@/app/components/MatchupCard';

const LEAGUE_ID_REDRAFT = process.env.NEXT_PUBLIC_LEAGUE_ID_REDRAFT!;

export default function MatchupsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  const [matchupData, setMatchupData] = useState<MatchupView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(14);
  
  // Determinar tipo de liga e semanas válidas usando useMemo para evitar recriação
  const leagueConfig = useMemo(() => {
    const leagueType = leagueId === LEAGUE_ID_REDRAFT ? 'redraft' : 'dynasty';
    const leagueName = leagueType === 'redraft' ? 'TFL Redraft' : 'TFL Dynasty';
    const validWeeks = leagueType === 'redraft' ? [14] : [10, 11, 12, 13];
    return { leagueType, leagueName, validWeeks };
  }, [leagueId]);
  
  const { leagueType, leagueName, validWeeks } = leagueConfig;
  
  // Definir semana inicial baseada no tipo de liga
  useEffect(() => {
    if (leagueType === 'dynasty') {
      setSelectedWeek(10); // Semana inicial para Dynasty
    }
  }, [leagueType]);

  // Buscar dados dos confrontos com controle de requisições
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
        
        const response = await fetch(`/api/matchups?league=${leagueId}&week=${selectedWeek}`);
        
        // Verificar se o componente ainda está montado
        if (isCancelled) return;
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao buscar confrontos');
        }
        
        const data: MatchupView = await response.json();
        
        // Verificar novamente se o componente ainda está montado
        if (!isCancelled) {
          setMatchupData(data);
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
    
    // Cleanup function para cancelar requisições pendentes
    return () => {
      isCancelled = true;
    };
  }, [leagueId, selectedWeek, validWeeks]);



  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            Preview de Confrontos
          </h1>
          <p className="text-lg text-text-muted">
            {leagueName}
          </p>
        </div>

        {/* Seletor de semana para Dynasty - Fixo no topo */}
        {leagueType === 'dynasty' && (
          <div className="sticky top-16 z-40 bg-background border-b border-border pb-4 mb-6">
            <div className="bg-surface rounded-lg border border-border p-4">
              <label className="block text-sm font-medium text-text mb-3">
                Selecionar Semana dos Playoffs:
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
              {matchupData && (
                <p className="mt-2 text-xs text-text-muted">
                  Regra aplicada: {matchupData.rule}
                </p>
              )}
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
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">
                  Erro ao carregar confrontos
                </h3>
                <p className="mt-1 text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {matchupData && !loading && (
          <div>
            {/* Info da semana e regra */}
            <div className="bg-accent/10 border border-accent/30 rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold text-accent mb-1">
                Semana {matchupData.week} - {leagueName}
              </h2>
              <p className="text-sm text-accent/80">
                Regra: {matchupData.rule}
              </p>
            </div>

            {/* Lista de confrontos */}
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
                
                {/* Informações adicionais */}
                <div className="mt-8 p-4 bg-surface rounded-lg border border-border">
                  <h3 className="text-sm font-medium text-text mb-2">Informações dos Confrontos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-text-muted">
                    <div>
                      <span className="font-medium">Total de confrontos:</span> {matchupData.pairs.length}
                    </div>
                    <div>
                      <span className="font-medium">Semana:</span> {matchupData.week}
                    </div>
                    <div>
                      <span className="font-medium">Liga:</span> {leagueName}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <svg className="mx-auto h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-text">Nenhum confronto encontrado</h3>
                  <p className="mt-1 text-sm text-text-muted">Não há confrontos disponíveis para esta semana.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}