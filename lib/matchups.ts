import { Team } from './sleeper';

// Tipos para os confrontos
export type Pair = {
  home: Team;
  away: Team;
};

export type MatchupView = {
  leagueId: string;
  week: number;
  rule: string;
  pairs: Pair[];
};

/**
 * Função para pareamento Redraft (14 times)
 * Semana 14: 1º vs 2º, 3º vs 4º, ..., 13º vs 14º
 * @param teams Array de times já ordenados por ranking
 * @returns Array de pares de confrontos
 */
export function pairTopXvsTopX(teams: Team[]): Pair[] {
  const pairs: Pair[] = [];
  
  // Pareia times consecutivos: 1vs2, 3vs4, 5vs6, etc.
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      pairs.push({
        home: teams[i],     // Time com ranking melhor (menor número)
        away: teams[i + 1]  // Time com ranking pior (maior número)
      });
    }
  }
  
  return pairs;
}

/**
 * Função para pareamento Dynasty (10 times)
 * Regras específicas por semana:
 * - Semana 10: 1×2, 4×5, 6×7, 8×9, 3×10
 * - Semana 11: 1×3, 2×10, 4×6, 5×7, 8×9
 * - Semana 12: 1×4, 2×5, 3×6, 7×8, 9×10
 * - Semana 13: 1×2, 3×5, 4×6, 7×8, 9×10
 * @param teams Array de times já ordenados por ranking
 * @param week Semana (10, 11, 12 ou 13)
 * @returns Array de pares de confrontos
 */
export function pairDynasty(teams: Team[], week: 10 | 11 | 12 | 13): Pair[] {
  if (teams.length !== 10) {
    throw new Error('Liga Dynasty deve ter exatamente 10 times');
  }
  
  const pairs: Pair[] = [];
  
  // Mapeamento das regras por semana (índices baseados em 0)
  const weekRules: Record<number, [number, number][]> = {
    10: [[0, 1], [3, 4], [5, 6], [7, 8], [2, 9]], // 1×2, 4×5, 6×7, 8×9, 3×10
    11: [[0, 2], [1, 9], [3, 5], [4, 6], [7, 8]], // 1×3, 2×10, 4×6, 5×7, 8×9
    12: [[0, 3], [1, 4], [2, 5], [6, 7], [8, 9]], // 1×4, 2×5, 3×6, 7×8, 9×10
    13: [[0, 1], [2, 4], [3, 5], [6, 7], [8, 9]]  // 1×2, 3×5, 4×6, 7×8, 9×10
  };
  
  const rules = weekRules[week];
  if (!rules) {
    throw new Error(`Semana ${week} não é válida para Dynasty (deve ser 10, 11, 12 ou 13)`);
  }
  
  // Cria os pares baseado nas regras da semana
  for (const [homeIndex, awayIndex] of rules) {
    pairs.push({
      home: teams[homeIndex],
      away: teams[awayIndex]
    });
  }
  
  return pairs;
}

/**
 * Função auxiliar para validar se uma semana é válida para uma liga
 * @param leagueType Tipo da liga ('redraft' ou 'dynasty')
 * @param week Número da semana
 * @returns true se a semana é válida para o tipo de liga
 */
export function isValidWeekForLeague(leagueType: 'redraft' | 'dynasty', week: number): boolean {
  if (leagueType === 'redraft') {
    return week === 14;
  }
  
  if (leagueType === 'dynasty') {
    return [10, 11, 12, 13].includes(week);
  }
  
  return false;
}

/**
 * Função auxiliar para determinar o tipo de regra baseado na liga e semana
 * @param leagueType Tipo da liga
 * @param week Número da semana
 * @returns String identificando a regra aplicada
 */
export function getMatchupRule(leagueType: 'redraft' | 'dynasty', week: number): string {
  if (leagueType === 'redraft' && week === 14) {
    return 'redraft-topx';
  }
  
  if (leagueType === 'dynasty' && [10, 11, 12, 13].includes(week)) {
    return `dynasty-week${week}`;
  }
  
  throw new Error(`Combinação inválida: ${leagueType} semana ${week}`);
}