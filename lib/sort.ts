import { Team } from './sleeper';

// Função auxiliar para determinar o tipo de liga baseado no ID
export function getLeagueType(leagueId: string): 'redraft' | 'dynasty' {
  // IDs das ligas configurados no ambiente
  const LEAGUE_ID_REDRAFT = process.env.LEAGUE_ID_REDRAFT || '1180180342143975424';
  const LEAGUE_ID_DYNASTY = process.env.LEAGUE_ID_DYNASTY || '1180180565689552896';
  
  if (leagueId === LEAGUE_ID_REDRAFT) {
    return 'redraft';
  } else if (leagueId === LEAGUE_ID_DYNASTY) {
    return 'dynasty';
  }
  
  // Fallback para redraft se não reconhecer o ID
  return 'redraft';
}

// Função para calcular Win% = (wins + 0.5*ties) / (wins+losses+ties)
function calculateWinPercentage(wins: number, losses: number, ties: number): number {
  const totalGames = wins + losses + ties;
  if (totalGames === 0) return 0;
  return (wins + 0.5 * ties) / totalGames;
}

// Função de ordenação dos standings
export function sortStandings(a: Omit<Team, 'rank'>, b: Omit<Team, 'rank'>): number {
  // 1º critério: Win% (descendente)
  const winPercentageA = calculateWinPercentage(a.wins, a.losses, a.ties);
  const winPercentageB = calculateWinPercentage(b.wins, b.losses, b.ties);
  
  if (winPercentageA !== winPercentageB) {
    return winPercentageB - winPercentageA; // Descendente
  }
  
  // 2º critério: pointsFor (descendente)
  if (a.pointsFor !== b.pointsFor) {
    return b.pointsFor - a.pointsFor; // Descendente
  }
  
  // 3º critério: rosterId (ascendente) para desempate estável
  return a.rosterId - b.rosterId; // Ascendente
}

// Aplica ordenação e adiciona ranks
export function applyRankings(teams: Omit<Team, 'rank'>[], leagueType?: 'redraft' | 'dynasty'): Team[] {
  // Ordenação padrão
  const sortedTeams = [...teams].sort((a, b) => sortStandings(a, b));
  
  // Aplicar lógica específica para liga redraft: 7º colocado determinado por pontos totais
  if (leagueType === 'redraft' && sortedTeams.length >= 7) {
    // Separar os primeiros 6 colocados (já ordenados corretamente)
    const top6 = sortedTeams.slice(0, 6);
    
    // Separar os times do 7º colocado em diante
    const remaining = sortedTeams.slice(6);
    
    // Para o 7º colocado, ordenar apenas por pontos totais (descendente)
    // Os demais (8º em diante) mantêm a ordenação padrão
    
    // Reordenar todos os times do 7º colocado em diante por pontos totais para determinar o 7º
    const candidatesForSeventh = remaining.sort((a, b) => {
      // Ordenar por pontos totais (descendente)
      if (a.pointsFor !== b.pointsFor) {
        return b.pointsFor - a.pointsFor;
      }
      // Desempate por rosterId
      return a.rosterId - b.rosterId;
    });
    
    // O primeiro da lista ordenada por pontos é o 7º colocado
    const actualSeventh = candidatesForSeventh[0];
    
    // Remover o 7º colocado da lista e manter os outros na ordem original
    const remainingAfterSeventh = remaining.filter(team => team.rosterId !== actualSeventh.rosterId);
    
    // Reconstruir a lista final
    const finalOrder = [...top6, actualSeventh, ...remainingAfterSeventh];
    
    return finalOrder.map((team, index) => ({
      ...team,
      rank: index + 1
    }));
  }
  
  // Para dynasty ou quando não há pelo menos 7 times, usar ordenação padrão
  return sortedTeams.map((team, index) => ({
    ...team,
    rank: index + 1
  }));
}