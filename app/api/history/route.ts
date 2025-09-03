import { NextRequest, NextResponse } from 'next/server';
import { fetchLeagueData, mapSleeperDataToTeams } from '@/lib/sleeper';
import { applyRankings } from '@/lib/sort';
import { fetchPlayoffFinal } from '@/lib/playoffs';

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';

// Interface para dados de uma temporada
interface SeasonData {
  year: string;
  leagueId: string;
  champion: {
    rosterId: number;
    displayName: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    seed?: number;
  } | null;
  runnerUp: {
    rosterId: number;
    displayName: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    seed?: number;
  } | null;
  standings: Array<{
    rank: number;
    displayName: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
  }>;
  bracket?: {
    finalRound: number;
  };
}

// Interface para resposta da API
interface HistoryResponse {
  leagueType: string;
  seasons: SeasonData[];
}

// Função para buscar dados de uma temporada específica
async function fetchSeasonData(leagueId: string, year: string): Promise<SeasonData | null> {
  try {
    // Buscar dados do Sleeper sem cache para garantir dados atualizados
    const { league, users, rosters } = await fetchLeagueData(leagueId, false);
    
    // Verificar se os dados são válidos
    if (!league) {
      console.warn(`Liga ${leagueId} não encontrada para o ano ${year}`);
      return null;
    }
    
    if (!Array.isArray(users) || users.length === 0) {
      console.warn(`Nenhum usuário encontrado para a liga ${leagueId} (${year})`);
      return null;
    }
    
    if (!Array.isArray(rosters) || rosters.length === 0) {
      console.warn(`Nenhum roster encontrado para a liga ${leagueId} (${year})`);
      return null;
    }
    
    // Mapear dados para o formato interno
    const teamsWithoutRank = mapSleeperDataToTeams(users, rosters);
    
    // Verificar se conseguimos mapear pelo menos um time
    if (teamsWithoutRank.length === 0) {
      console.warn(`Nenhum time válido encontrado para a liga ${leagueId} (${year})`);
      return null;
    }
    
    // Aplicar rankings
    const teams = applyRankings(teamsWithoutRank);
    
    // Ordenar por ranking
    const sortedTeams = teams.sort((a, b) => a.rank - b.rank);
    
    // Buscar dados dos playoffs para determinar campeão e vice
    const playoffResult = await fetchPlayoffFinal(leagueId);
    
    let champion = null;
    let runnerUp = null;
    let bracket = undefined;
    
    if (playoffResult) {
      // Encontrar campeão e vice pelos playoffs
      const championTeam = teams.find(team => team.rosterId === playoffResult.championRosterId);
      const runnerUpTeam = teams.find(team => team.rosterId === playoffResult.runnerUpRosterId);
      
      champion = championTeam ? {
        rosterId: championTeam.rosterId,
        displayName: championTeam.displayName,
        wins: championTeam.wins,
        losses: championTeam.losses,
        ties: championTeam.ties,
        pointsFor: championTeam.pointsFor,
        seed: championTeam.rank
      } : null;
      
      runnerUp = runnerUpTeam ? {
        rosterId: runnerUpTeam.rosterId,
        displayName: runnerUpTeam.displayName,
        wins: runnerUpTeam.wins,
        losses: runnerUpTeam.losses,
        ties: runnerUpTeam.ties,
        pointsFor: runnerUpTeam.pointsFor,
        seed: runnerUpTeam.rank
      } : null;
      
      bracket = {
        finalRound: playoffResult.finalRound
      };
    } else {
      // Fallback: usar standings se playoffs não estiverem disponíveis
      console.warn(`Playoffs não encontrados para liga ${leagueId} (${year}), usando standings como fallback`);
      
      champion = sortedTeams[0] ? {
        rosterId: sortedTeams[0].rosterId,
        displayName: sortedTeams[0].displayName,
        wins: sortedTeams[0].wins,
        losses: sortedTeams[0].losses,
        ties: sortedTeams[0].ties,
        pointsFor: sortedTeams[0].pointsFor,
        seed: sortedTeams[0].rank
      } : null;
      
      runnerUp = sortedTeams[1] ? {
        rosterId: sortedTeams[1].rosterId,
        displayName: sortedTeams[1].displayName,
        wins: sortedTeams[1].wins,
        losses: sortedTeams[1].losses,
        ties: sortedTeams[1].ties,
        pointsFor: sortedTeams[1].pointsFor,
        seed: sortedTeams[1].rank
      } : null;
    }
    
    // Mapear standings completos
    const standings = sortedTeams.map(team => ({
      rank: team.rank,
      displayName: team.displayName,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst
    }));
    
    return {
      year,
      leagueId,
      champion,
      runnerUp,
      standings,
      bracket
    };
  } catch (error) {
    console.error(`Erro ao buscar dados da temporada ${year} (${leagueId}):`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueType = searchParams.get('leagueType');
    
    // Validação do parâmetro leagueType
    if (!leagueType || !['redraft', 'dynasty'].includes(leagueType)) {
      return NextResponse.json(
        { error: 'Parâmetro "leagueType" deve ser "redraft" ou "dynasty"' },
        { status: 400 }
      );
    }
    
    // Definir IDs das ligas baseado no tipo
    let leagueIds: { [year: string]: string } = {};
    
    if (leagueType === 'redraft') {
      leagueIds = {
        '2022': process.env.LEAGUE_ID_REDRAFT_2022 || '',
        '2023': process.env.LEAGUE_ID_REDRAFT_2023 || '',
        '2024': process.env.LEAGUE_ID_REDRAFT_2024 || ''
      };
    } else if (leagueType === 'dynasty') {
      leagueIds = {
        '2024': process.env.LEAGUE_ID_DYNASTY_2024 || ''
      };
    }
    
    // Filtrar apenas IDs válidos (não vazios)
    const validLeagueIds = Object.entries(leagueIds)
      .filter(([_, id]) => id.trim() !== '')
      .reduce((acc, [year, id]) => ({ ...acc, [year]: id }), {});
    
    if (Object.keys(validLeagueIds).length === 0) {
      return NextResponse.json(
        { error: `Nenhum ID de liga configurado para ${leagueType}` },
        { status: 404 }
      );
    }
    
    // Buscar dados de todas as temporadas em paralelo
    const seasonPromises = Object.entries(validLeagueIds).map(([year, leagueId]) =>
      fetchSeasonData(leagueId as string, year)
    );
    
    const seasonResults = await Promise.all(seasonPromises);
    
    // Filtrar resultados válidos e ordenar por ano (mais recente primeiro)
    const seasons = seasonResults
      .filter((season): season is SeasonData => season !== null)
      .sort((a, b) => parseInt(b.year) - parseInt(a.year));
    
    const response: HistoryResponse = {
      leagueType,
      seasons
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro na API de histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}