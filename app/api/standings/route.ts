import { NextRequest, NextResponse } from 'next/server';
import { fetchLeagueData, mapSleeperDataToTeams, Team, getCacheConfig, isInSeason } from '@/lib/sleeper';
import { applyRankings } from '@/lib/sort';

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
    
    // Validação do parâmetro league
    if (!leagueId) {
      return NextResponse.json(
        { error: 'Parâmetro "league" é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se é um dos IDs válidos das env vars
    const validLeagueIds = [
      process.env.LEAGUE_ID_REDRAFT,
      process.env.LEAGUE_ID_DYNASTY
    ].filter(Boolean);
    
    if (!validLeagueIds.includes(leagueId)) {
      return NextResponse.json(
        { error: 'ID da liga não é válido' },
        { status: 400 }
      );
    }
    
    // Buscar dados do Sleeper com cache dinâmico
    // O cache é automaticamente aplicado baseado na temporada
    const { league, users, rosters } = await fetchLeagueData(leagueId, true);
    
    // Mapear dados para o formato interno
    const teamsWithoutRank = mapSleeperDataToTeams(users, rosters);
    
    // Aplicar ordenação e rankings
    const teams = applyRankings(teamsWithoutRank);
    
    // Montar resposta
    const response: StandingsResponse = {
      leagueId: league.league_id,
      season: league.season,
      week: league.settings?.week || 0,
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
        'X-In-Season': isInSeason().toString()
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