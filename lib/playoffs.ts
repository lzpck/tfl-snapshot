import { fetchJSON } from './sleeper';

// Interfaces para dados dos playoffs do Sleeper
export interface SleeperWinnersBracket {
  r: number; // rodada
  m: number; // matchup id
  t1: number; // roster_id do time 1
  t2: number; // roster_id do time 2
  w?: number; // roster_id do vencedor (se definido)
  l?: number; // roster_id do perdedor (se definido)
  p1?: number; // pontos do time 1
  p2?: number; // pontos do time 2
}

export interface PlayoffResult {
  championRosterId: number;
  runnerUpRosterId: number;
  finalRound: number;
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
}

/**
 * Busca dados dos playoffs e determina campeão e vice-campeão
 * @param leagueId ID da liga no Sleeper
 * @returns Dados do resultado final dos playoffs ou null se não encontrado
 */
export async function fetchPlayoffFinal(leagueId: string): Promise<PlayoffResult | null> {
  try {
    const baseUrl = 'https://api.sleeper.app/v1';
    
    // Buscar winners bracket
    const winnersBracket = await fetchJSON<SleeperWinnersBracket[]>(
      `${baseUrl}/league/${leagueId}/winners_bracket`,
      { cacheKey: `winners-bracket-${leagueId}` }
    );
    
    // Verificar se o bracket existe e tem dados
    if (!Array.isArray(winnersBracket) || winnersBracket.length === 0) {
      console.warn(`Winners bracket não encontrado ou vazio para liga ${leagueId}`);
      return null;
    }
    
    // Encontrar a rodada final (maior valor de r)
    const finalRound = Math.max(...winnersBracket.map(match => match.r));
    
    // Buscar partida(s) da final
    const finalMatches = winnersBracket.filter(match => match.r === finalRound);
    
    if (finalMatches.length === 0) {
      console.warn(`Nenhuma partida encontrada na rodada final ${finalRound} para liga ${leagueId}`);
      return null;
    }
    
    // Processar a partida final (assumindo que há apenas uma)
    const finalMatch = finalMatches[0];
    
    // Validar se os times estão presentes
    if (!finalMatch.t1 || !finalMatch.t2) {
      console.warn(`Times não definidos na partida final para liga ${leagueId}:`, finalMatch);
      return null;
    }
    
    let championRosterId: number;
    let runnerUpRosterId: number;
    
    // Determinar vencedor e vice
    if (finalMatch.w) {
      // Se o vencedor está definido no campo 'w'
      championRosterId = finalMatch.w;
      runnerUpRosterId = finalMatch.t1 === championRosterId ? finalMatch.t2 : finalMatch.t1;
    } else if (finalMatch.p1 !== undefined && finalMatch.p2 !== undefined) {
      // Se não há vencedor definido, usar pontuação
      if (finalMatch.p1 > finalMatch.p2) {
        championRosterId = finalMatch.t1;
        runnerUpRosterId = finalMatch.t2;
      } else if (finalMatch.p2 > finalMatch.p1) {
        championRosterId = finalMatch.t2;
        runnerUpRosterId = finalMatch.t1;
      } else {
        // Empate - usar fallback para matchups
        console.warn(`Empate na final detectado para liga ${leagueId}, tentando fallback`);
        const fallbackResult = await fetchPlayoffFinalFallback(leagueId, finalMatch);
        if (fallbackResult) {
          return { ...fallbackResult, finalRound };
        }
        return null;
      }
    } else {
      // Fallback: buscar dados de matchups se não há pontuação no bracket
      console.warn(`Pontuação não disponível no bracket para liga ${leagueId}, tentando fallback`);
      const fallbackResult = await fetchPlayoffFinalFallback(leagueId, finalMatch);
      if (fallbackResult) {
        return { ...fallbackResult, finalRound };
      }
      return null;
    }
    
    return {
      championRosterId,
      runnerUpRosterId,
      finalRound
    };
    
  } catch (error) {
    console.error(`Erro ao buscar dados dos playoffs para liga ${leagueId}:`, error);
    return null;
  }
}

/**
 * Fallback: busca dados de matchups para determinar vencedor quando bracket não tem informações suficientes
 * @param leagueId ID da liga
 * @param finalMatch Partida final do bracket
 * @returns Resultado dos playoffs ou null
 */
async function fetchPlayoffFinalFallback(
  leagueId: string, 
  finalMatch: SleeperWinnersBracket
): Promise<Omit<PlayoffResult, 'finalRound'> | null> {
  try {
    const baseUrl = 'https://api.sleeper.app/v1';
    
    // Buscar dados da liga para obter informações sobre playoffs
    const league = await fetchJSON<any>(`${baseUrl}/league/${leagueId}`);
    
    if (!league || !league.settings || !league.settings.playoff_week_start) {
      console.warn(`Informações de playoff não encontradas para liga ${leagueId}`);
      return null;
    }
    
    const playoffWeekStart = league.settings.playoff_week_start;
    const currentWeek = league.settings.leg || league.settings.week || playoffWeekStart;
    
    // Tentar algumas semanas de playoff para encontrar a final
    for (let week = currentWeek; week >= playoffWeekStart; week--) {
      try {
        const matchups = await fetchJSON<SleeperMatchup[]>(
          `${baseUrl}/league/${leagueId}/matchups/${week}`,
          { cacheKey: `matchups-${leagueId}-${week}` }
        );
        
        if (!Array.isArray(matchups)) continue;
        
        // Buscar matchups que contenham os times da final
        const t1Matchup = matchups.find(m => m.roster_id === finalMatch.t1);
        const t2Matchup = matchups.find(m => m.roster_id === finalMatch.t2);
        
        if (t1Matchup && t2Matchup && t1Matchup.matchup_id === t2Matchup.matchup_id) {
          // Encontrou a partida final
          if (t1Matchup.points > t2Matchup.points) {
            return {
              championRosterId: finalMatch.t1,
              runnerUpRosterId: finalMatch.t2
            };
          } else if (t2Matchup.points > t1Matchup.points) {
            return {
              championRosterId: finalMatch.t2,
              runnerUpRosterId: finalMatch.t1
            };
          }
        }
      } catch (weekError) {
        console.warn(`Erro ao buscar matchups da semana ${week} para liga ${leagueId}:`, weekError);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Erro no fallback de playoffs para liga ${leagueId}:`, error);
    return null;
  }
}

/**
 * Busca informações básicas dos playoffs de uma liga
 * @param leagueId ID da liga
 * @returns Informações básicas dos playoffs ou null
 */
export async function fetchPlayoffInfo(leagueId: string): Promise<{ playoffWeekStart: number; totalWeeks: number } | null> {
  try {
    const baseUrl = 'https://api.sleeper.app/v1';
    const league = await fetchJSON<any>(`${baseUrl}/league/${leagueId}`);
    
    if (!league || !league.settings) {
      return null;
    }
    
    const playoffWeekStart = league.settings.playoff_week_start;
    const totalWeeks = league.settings.leg || league.settings.week || 18;
    
    if (!playoffWeekStart) {
      return null;
    }
    
    return {
      playoffWeekStart,
      totalWeeks
    };
  } catch (error) {
    console.error(`Erro ao buscar informações de playoff para liga ${leagueId}:`, error);
    return null;
  }
}