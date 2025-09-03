import { Team } from './sleeper';

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
export function applyRankings(teams: Omit<Team, 'rank'>[]): Team[] {
  const sortedTeams = [...teams].sort(sortStandings);
  
  return sortedTeams.map((team, index) => ({
    ...team,
    rank: index + 1
  }));
}