import { NextRequest, NextResponse } from 'next/server';
import { pairTopXvsTopX, pairDynasty, isValidWeekForLeague, getMatchupRule, MatchupView } from '@/lib/matchups';
import { Team, getCacheConfig, isInSeason, fetchWinnersBracket, fetchLeagueData, fetchMatchups, SleeperMatchup } from '@/lib/sleeper';

// Forçar rota dinâmica para evitar problemas de renderização estática
export const dynamic = 'force-dynamic';

// IDs das ligas configurados no ambiente
const LEAGUE_ID_REDRAFT = process.env.LEAGUE_ID_REDRAFT!;
const LEAGUE_ID_DYNASTY = process.env.LEAGUE_ID_DYNASTY!;

/**
 * Cria um time placeholder para brackets
 */
function createPlaceholderTeam(rosterId: number | null, source?: { w?: number; l?: number } | null): Team {
  let displayName = 'TBD';
  
  if (source?.w) {
    displayName = `Vencedor M${source.w}`;
  } else if (source?.l) {
    displayName = `Perdedor M${source.l}`;
  }

  return {
    rank: 99,
    rosterId: rosterId || 0,
    ownerId: 'placeholder',
    displayName,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0
  };
}

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
 * - Liga Dynasty Playoffs (week=15,16,17): bracket do Sleeper
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
      const validWeeks = leagueType === 'redraft' ? '14' : '10, 11, 12, 13 (Regular), 15-17 (Playoffs)';
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
        rule = getMatchupRule(leagueType, week);
        
        if (rule === 'dynasty-playoffs') {
          // Buscar dados da liga para saber início dos playoffs
          // Padrão TFL: Week 14
          const { league } = await fetchLeagueData(leagueId);
          const playoffStartWeek = league?.settings?.playoff_week_start || 14; 
          const round = week - playoffStartWeek + 1;

          // Buscar bracket (Winners)
          const bracket = await fetchWinnersBracket(leagueId);
          
          const roundMatches = bracket.filter(m => m.r === round);

          pairs = roundMatches.map(match => {
            const home = teams.find(t => t.rosterId === (match.t1 || -1)) 
              || createPlaceholderTeam(match.t1, match.t1_from);
              
            const away = teams.find(t => t.rosterId === (match.t2 || -1)) 
              || createPlaceholderTeam(match.t2, match.t2_from);

            // Determinar status
            let status: 'scheduled' | 'in_progress' | 'final' = 'scheduled';
            
            // Se houver um vencedor definido no bracket, é final
            if (match.w) {
              status = 'final';
            } else if (home.pointsFor > 0 || away.pointsFor > 0) {
              // Se não tem vencedor mas tem pontos, está em progresso
              status = 'in_progress';
            }

            return { home, away, status };
          });

        } else {
          // Dynasty Regular (10-13) - Buscar matchups reais para obter placar
          // Se a semana já passou ou está em andamento, buscamos da API real do Sleeper
          // para ter os pontos exatos.
          
          try {
            // Tentar buscar matchups reais da API
            // OBS: Só faz sentido se a semana já tiver matchups gerados no Sleeper
            const realMatchups = await fetchMatchups(leagueId, week);
            
            if (realMatchups && realMatchups.length > 0) {
               // Agrupar por matchup_id
               const matchupMap = new Map<number, SleeperMatchup[]>();
               realMatchups.forEach(m => {
                 if (!matchupMap.has(m.matchup_id)) matchupMap.set(m.matchup_id, []);
                 matchupMap.get(m.matchup_id)?.push(m);
               });
               
               pairs = Array.from(matchupMap.values()).map(match => {
                 const m1 = match[0];
                 const m2 = match[1];
                 
                 // Encontrar times
                 const t1 = teams.find(t => t.rosterId === m1.roster_id);
                 const t2 = teams.find(t => t.rosterId === m2.roster_id);
                 
                 if (!t1 || !t2) return null;
                 
                 // Atualizar pontos com o valor real do matchup
                 const home = { ...t1, pointsFor: m1.points };
                 const away = { ...t2, pointsFor: m2.points };

                 // Status
                 let status: 'scheduled' | 'in_progress' | 'final' = 'scheduled';
                 // Semanas 10-13 são passadas em relação ao playoff (14)
                 if (home.pointsFor > 0 && away.pointsFor > 0) {
                    status = 'final';
                 }

                 return { home, away, status };
               }).filter(p => p !== null) as { home: Team, away: Team, status?: 'scheduled' | 'in_progress' | 'final' }[];
               
            } 
            
            // Fallback: Se não encontrou matchups reais (ex: futuro muito distante ou erro), 
            // usa a lógica de projeção fixa
            if (!pairs || pairs.length === 0) {
               if (teams.length !== 10) {
                  throw new Error(`Liga Dynasty deve ter exatamente 10 times, encontrados: ${teams.length}`);
               }
               pairs = pairDynasty(teams, week as 10 | 11 | 12 | 13);
               pairs.forEach(p => p.status = 'scheduled');
            }
            
          } catch (err) {
            console.warn('Erro ao buscar matchups reais, usando fallback:', err);
             if (teams.length !== 10) {
                throw new Error(`Liga Dynasty deve ter exatamente 10 times, encontrados: ${teams.length}`);
             }
             pairs = pairDynasty(teams, week as 10 | 11 | 12 | 13);
             pairs.forEach(p => p.status = 'scheduled');
          }
        }
      }
    } catch (error) {
      return NextResponse.json(
        { error: `Erro ao gerar confrontos: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
        { status: 500 }
      );
    }

    // Montar resposta usando a semana solicitada pelo usuário
    const matchupView: MatchupView = {
      leagueId,
      week: week, // Usa a semana solicitada pelo usuário
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