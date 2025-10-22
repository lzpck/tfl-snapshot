import { Team } from './sleeper';
import { getLeagueConfig } from './env-validation';

// Função auxiliar para determinar o tipo de liga baseado no ID
export function getLeagueType(leagueId: string): 'redraft' | 'dynasty' {
  try {
    // Obter configurações validadas das ligas
    const leagueConfig = getLeagueConfig();
    
    if (leagueId === leagueConfig.redraft) {
      return 'redraft';
    } else if (leagueId === leagueConfig.dynasty) {
      return 'dynasty';
    }
    
    // Verificar ligas históricas
    const historical = leagueConfig.historical;
    
    // Verificar redraft históricas
    if (leagueId === historical.redraft[2022] || 
        leagueId === historical.redraft[2023] || 
        leagueId === historical.redraft[2024]) {
      return 'redraft';
    }
    
    // Verificar dynasty históricas
    if (leagueId === historical.dynasty[2024]) {
      return 'dynasty';
    }
    
    // Fallback para redraft se não reconhecer o ID
    console.warn(`⚠️ ID de liga não reconhecido: ${leagueId}. Usando tipo 'redraft' como fallback.`);
    return 'redraft';
  } catch (error) {
    console.error('❌ Erro ao determinar tipo de liga:', error);
    // Fallback para redraft em caso de erro
    return 'redraft';
  }
}

// Função para calcular Win% = (wins + 0.5*ties) / (wins+losses+ties)
function calculateWinPercentage(wins: number, losses: number, ties: number): number {
  const totalGames = wins + losses + ties;
  if (totalGames === 0) return 0;
  return (wins + 0.5 * ties) / totalGames;
}

// Função de ordenação padrão do Sleeper (baseada na documentação oficial)
export function sortStandingsSleeperDefault(a: Omit<Team, 'rank'>, b: Omit<Team, 'rank'>): number {
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
  
  // 3º critério: pointsAgainst (descendente) - conforme documentação do Sleeper
  if (a.pointsAgainst !== b.pointsAgainst) {
    return b.pointsAgainst - a.pointsAgainst; // Descendente
  }
  
  // 4º critério: rosterId (ascendente) para desempate estável
  return a.rosterId - b.rosterId; // Ascendente
}

// Função de ordenação dos standings (REGRA PERSONALIZADA PRESERVADA)
// Esta é nossa regra customizada que foi desenvolvida especificamente para a liga redraft
// onde o 7º colocado é determinado exclusivamente por pontos totais
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

// Aplica lógica da "Corrida pelos Pontos" - nova funcionalidade
export function applyPointsRaceRankings(teams: Omit<Team, 'rank'>[]): Team[] {
  // Primeiro, aplicar ordenação padrão para determinar os 6 classificados
  const standardSorted = [...teams].sort((a, b) => sortStandingsSleeperDefault(a, b));
  
  // Separar os 6 primeiros (classificados) dos demais
  const top6Qualified = standardSorted.slice(0, 6);
  const remaining = standardSorted.slice(6);
  
  // Reordenar os times restantes (7º ao 14º) por pontos feitos (descendente)
  const pointsSorted = remaining.sort((a, b) => {
    if (a.pointsFor !== b.pointsFor) {
      return b.pointsFor - a.pointsFor; // Descendente
    }
    // Desempate por rosterId
    return a.rosterId - b.rosterId;
  });
  
  // Combinar: 6 classificados + demais ordenados por pontos
  const finalOrder = [...top6Qualified, ...pointsSorted];
  
  return finalOrder.map((team, index) => ({
    ...team,
    rank: index + 1
  }));
}

// Aplica ordenação padrão do Sleeper e adiciona ranks
export function applySleeperDefaultRankings(teams: Omit<Team, 'rank'>[]): Team[] {
  // Usar ordenação padrão do Sleeper (sem lógica customizada)
  const sortedTeams = [...teams].sort((a, b) => sortStandingsSleeperDefault(a, b));
  
  return sortedTeams.map((team, index) => ({
    ...team,
    rank: index + 1
  }));
}

// Aplica ordenação e adiciona ranks (LÓGICA PERSONALIZADA PRESERVADA)
// Esta função mantém nossa lógica customizada para a liga redraft
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