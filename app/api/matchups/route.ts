import { NextRequest, NextResponse } from 'next/server';
import { pairTopXvsTopX, pairDynasty, isValidWeekForLeague, getMatchupRule, MatchupView } from '@/lib/matchups';
import { Team, getCacheConfig, isInSeason } from '@/lib/sleeper';

// Forçar rota dinâmica para evitar problemas de renderização estática
export const dynamic = 'force-dynamic';

// IDs das ligas configurados no ambiente
const LEAGUE_ID_REDRAFT = process.env.LEAGUE_ID_REDRAFT!;
const LEAGUE_ID_DYNASTY = process.env.LEAGUE_ID_DYNASTY!;

/**
 * API para gerar confrontos (matchups) baseados nas regras específicas de cada liga
 * 
 * Query params obrigatórios:
 * - league: ID da liga
 * - week: Número da semana
 * 
 * Regras:
 * - Liga Redraft (week=14): pareamento consecutivo (1vs2, 3vs4, etc.)
 * - Liga Dynasty (week=10,11,12,13): pareamento específico por semana
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('league');
    const weekParam = searchParams.get('week');

    // Validação dos parâmetros obrigatórios
    if (!leagueId) {
      return NextResponse.json(
        { error: 'Parâmetro "league" é obrigatório' },
        { status: 400 }
      );
    }

    if (!weekParam) {
      return NextResponse.json(
        { error: 'Parâmetro "week" é obrigatório' },
        { status: 400 }
      );
    }

    const week = parseInt(weekParam, 10);
    if (isNaN(week)) {
      return NextResponse.json(
        { error: 'Parâmetro "week" deve ser um número válido' },
        { status: 400 }
      );
    }

    // Determinar o tipo de liga
    let leagueType: 'redraft' | 'dynasty';
    if (leagueId === LEAGUE_ID_REDRAFT) {
      leagueType = 'redraft';
    } else if (leagueId === LEAGUE_ID_DYNASTY) {
      leagueType = 'dynasty';
    } else {
      return NextResponse.json(
        { error: 'Liga não reconhecida. Use uma das ligas configuradas.' },
        { status: 400 }
      );
    }

    // Validar se a semana é válida para o tipo de liga
    if (!isValidWeekForLeague(leagueType, week)) {
      const validWeeks = leagueType === 'redraft' ? '14' : '10, 11, 12, 13';
      return NextResponse.json(
        { 
          error: `Semana ${week} não é válida para liga ${leagueType}. Semanas válidas: ${validWeeks}` 
        },
        { status: 400 }
      );
    }

    // Buscar os standings da liga (consulta interna com cache)
    const standingsUrl = new URL('/api/standings', request.url);
    standingsUrl.searchParams.set('league', leagueId);
    
    const cacheConfig = getCacheConfig();
    const standingsResponse = await fetch(standingsUrl.toString(), {
      headers: {
        'User-Agent': 'TFLSnapshot/1.0',
        'Cache-Control': `max-age=${cacheConfig.standingsTTL}`
      },
      // Usar cache do Next.js para requisições internas
      next: { revalidate: cacheConfig.standingsTTL }
    });

    if (!standingsResponse.ok) {
      return NextResponse.json(
        { error: 'Erro ao buscar standings da liga' },
        { status: 500 }
      );
    }

    const standingsData = await standingsResponse.json();
    const teams: Team[] = standingsData.teams;

    if (!teams || teams.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum time encontrado na liga' },
        { status: 404 }
      );
    }

    // Gerar os pares de confrontos baseado no tipo de liga e semana
    let pairs;
    let rule;

    try {
      if (leagueType === 'redraft') {
        pairs = pairTopXvsTopX(teams);
        rule = getMatchupRule(leagueType, week);
      } else {
        // Dynasty - validar que temos exatamente 10 times
        if (teams.length !== 10) {
          return NextResponse.json(
            { error: `Liga Dynasty deve ter exatamente 10 times, encontrados: ${teams.length}` },
            { status: 400 }
          );
        }
        pairs = pairDynasty(teams, week as 10 | 11 | 12 | 13);
        rule = getMatchupRule(leagueType, week);
      }
    } catch (error) {
      return NextResponse.json(
        { error: `Erro ao gerar confrontos: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
        { status: 500 }
      );
    }

    // Montar resposta
    const matchupView: MatchupView = {
      leagueId,
      week,
      rule,
      pairs
    };

    // Adicionar headers de cache para o navegador
    const maxAge = isInSeason() ? 30 : 180; // 30s em temporada, 3min fora
    
    return NextResponse.json(matchupView, {
      headers: {
        'Cache-Control': `public, max-age=${maxAge}, s-maxage=${cacheConfig.matchupsTTL}`,
        'X-Cache-Status': 'MISS',
        'X-Cache-TTL': cacheConfig.matchupsTTL.toString(),
        'X-In-Season': isInSeason().toString(),
        'X-League-Type': leagueType,
        'X-Week': week.toString()
      }
    });

  } catch (error) {
    console.error('Erro na API /api/matchups:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}