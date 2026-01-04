import { NextRequest, NextResponse } from 'next/server';
import { fetchLeagueData, mapSleeperDataToTeams, Team, getCacheConfig, isInSeason, fetchNFLState } from '@/lib/sleeper';
import { applyRankings, applySleeperDefaultRankings, applyPointsRaceRankings, getLeagueType } from '@/lib/sort';

// Forçar rota dinâmica para evitar problemas de renderização estática
export const dynamic = 'force-dynamic';

// Interface para resposta da API
interface StandingsResponse {
  leagueId: string;
  season: string;
  week: number;
  teams: Team[];
}

// Cache dinâmico baseado na temporada
// O cache agora é gerenciado pelo sistema em lib/sleeper.ts

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('league');
    const sortType = searchParams.get('sort') || 'sleeper'; // Padrão é 'sleeper'
    
    // Validação do parâmetro league
    if (!leagueId) {
      return NextResponse.json(
        { error: 'Parâmetro "league" é obrigatório' },
        { status: 400 }
      );
    }
    
    // Validação do parâmetro sort
    if (!['sleeper', 'custom', 'points-race'].includes(sortType)) {
      return NextResponse.json(
        { error: 'Parâmetro "sort" deve ser "sleeper", "custom" ou "points-race"' },
        { status: 400 }
      );
    }
    
    // Não restringimos a apenas IDs configurados para permitir visualização de leagues anteriores (histórico)
    // O fetchLeagueData abaixo irá validar se a liga existe na API do Sleeper.
    
    // Buscar dados do Sleeper e estado atual da NFL com cache dinâmico
    // O cache é automaticamente aplicado baseado na temporada
    const [{ league, users, rosters }, nflState] = await Promise.all([
      fetchLeagueData(leagueId, true),
      fetchNFLState()
    ]);
    
    // Verificar se a liga foi encontrada
    if (!league) {
      return NextResponse.json(
        { error: 'Liga não encontrada ou dados indisponíveis' },
        { status: 404 }
      );
    }
    
    // Mapear dados para o formato interno
    const teamsWithoutRank = mapSleeperDataToTeams(users, rosters);
    
    // Determinar o tipo de liga
    const leagueType = getLeagueType(leagueId);
    
    // Aplicar ordenação baseada no tipo solicitado
    let teams: Team[];
    if (sortType === 'sleeper') {
      // Usar ordenação padrão do Sleeper
      teams = applySleeperDefaultRankings(teamsWithoutRank);
    } else if (sortType === 'points-race') {
      // Usar ordenação da "Corrida pelos Pontos"
      teams = applyPointsRaceRankings(teamsWithoutRank);
    } else {
      // Usar ordenação customizada com lógica específica por tipo de liga
      teams = applyRankings(teamsWithoutRank, leagueType);
    }
    
    // Montar resposta usando a semana atual do estado da NFL
    const response: StandingsResponse = {
      leagueId: league.league_id,
      season: league.season,
      week: nflState.display_week, // Usa a semana atual da NFL
      teams
    };
    
    // Adicionar headers de cache para o navegador
    const cacheConfig = getCacheConfig();
    const maxAge = isInSeason() ? 30 : 180; // 30s em temporada, 3min fora
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, max-age=${maxAge}, s-maxage=${cacheConfig.standingsTTL}`,
        'X-Cache-Status': 'MISS',
        'X-Cache-TTL': cacheConfig.standingsTTL.toString(),
        'X-In-Season': isInSeason().toString(),
        'X-Sort-Type': sortType // Adicionar header para debug
      }
    });
    
  } catch (error) {
    console.error('Erro na API /api/standings:', error);
    
    // Erro específico do Sleeper
    if (error instanceof Error && error.message.includes('Erro na API do Sleeper')) {
      return NextResponse.json(
        { error: 'Erro ao consultar dados do Sleeper' },
        { status: 502 }
      );
    }
    
    // Erro genérico
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}