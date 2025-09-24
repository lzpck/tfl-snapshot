// Tipos para a API do Sleeper
export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  settings: {
    week?: number;
  };
}

export interface SleeperUser {
  user_id: string;
  display_name: string;
  username: string;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts?: number;
    fpts_against?: number;
    fpts_decimal?: number;
    fpts_against_decimal?: number;
  };
}

// Interface para matchups do Sleeper
export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
}

export interface Team {
  rank: number;
  rosterId: number;
  ownerId: string;
  displayName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
}

// Interface para o estado atual da NFL
export interface SleeperNFLState {
  week: number;
  display_week: number;
  season_type: string;
  leg: number;
}

// Sistema de cache in-memory
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Instância global do cache
const memoryCache = new MemoryCache();

// Configurações de TTL baseadas na temporada
interface CacheConfig {
  standingsTTL: number; // em segundos
  matchupsTTL: number;  // em segundos
}

// Determina se estamos em temporada ativa (setembro a janeiro)
function isInSeason(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() retorna 0-11
  return month >= 9 || month <= 1;
}

// Obtém configuração de cache baseada na temporada
function getCacheConfig(): CacheConfig {
  if (isInSeason()) {
    return {
      standingsTTL: 60,      // 1 minuto durante a temporada
      matchupsTTL: 60        // 1 minuto durante a temporada
    };
  } else {
    return {
      standingsTTL: 300,     // 5 minutos fora de temporada
      matchupsTTL: 600       // 10 minutos fora de temporada
    };
  }
}

// Helper para fazer requisições à API do Sleeper com cache
export async function fetchJSON<T>(
  url: string, 
  options: { 
    revalidate?: number; // TTL em segundos (opcional)
    cacheKey?: string;   // Chave personalizada do cache (opcional)
  } = {}
): Promise<T> {
  const { revalidate, cacheKey } = options;
  const finalCacheKey = cacheKey || url;
  
  // Verifica cache primeiro se TTL foi especificado
  if (revalidate) {
    const cached = memoryCache.get<T>(finalCacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Faz a requisição
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TFLSnapshot/1.0'
    },
    // Cache configurado baseado no TTL personalizado ou padrão do Next.js
    next: revalidate ? { revalidate } : { revalidate: 60 }
  });
  
  if (!response.ok) {
    throw new Error(`Erro na API do Sleeper: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Salva no cache se TTL foi especificado
  if (revalidate) {
    memoryCache.set(finalCacheKey, data, revalidate);
  }
  
  return data;
}

// Busca o estado atual da temporada NFL
export async function fetchNFLState(useCache = true): Promise<SleeperNFLState> {
  const baseUrl = 'https://api.sleeper.app/v1';
  const cacheConfig = getCacheConfig();
  
  const cacheOptions = useCache ? {
    revalidate: cacheConfig.standingsTTL,
    cacheKey: 'nfl-state'
  } : {};
  
  try {
    const state = await fetchJSON<SleeperNFLState>(`${baseUrl}/state/nfl`, cacheOptions);
    
    if (!state) {
      throw new Error('Estado da NFL não encontrado');
    }
    
    return state;
  } catch (error) {
    console.error('Erro ao buscar estado da NFL:', error);
    // Retorna valores padrão em caso de erro
    return {
      week: 1,
      display_week: 1,
      season_type: 'regular',
      leg: 1
    };
  }
}

// Exporta configurações de cache para uso nas APIs
export { getCacheConfig, isInSeason };

// Busca dados da liga no Sleeper com cache inteligente
export async function fetchLeagueData(leagueId: string, useCache = true) {
  const baseUrl = 'https://api.sleeper.app/v1';
  const cacheConfig = getCacheConfig();
  
  const cacheOptions = useCache ? {
    revalidate: cacheConfig.standingsTTL,
    cacheKey: `league-${leagueId}`
  } : {};
  
  try {
    const [league, users, rosters] = await Promise.all([
      fetchJSON<SleeperLeague>(`${baseUrl}/league/${leagueId}`, cacheOptions),
      fetchJSON<SleeperUser[]>(`${baseUrl}/league/${leagueId}/users`, cacheOptions),
      fetchJSON<SleeperRoster[]>(`${baseUrl}/league/${leagueId}/rosters`, cacheOptions)
    ]);
    
    // Validar dados retornados
    if (!league) {
      throw new Error(`Liga não encontrada: ${leagueId}`);
    }
    
    // Garantir que users e rosters são arrays válidos
    const validUsers = Array.isArray(users) ? users : [];
    const validRosters = Array.isArray(rosters) ? rosters : [];
    
    if (validUsers.length === 0) {
      console.warn(`Nenhum usuário encontrado para a liga ${leagueId}`);
    }
    
    if (validRosters.length === 0) {
      console.warn(`Nenhum roster encontrado para a liga ${leagueId}`);
    }
    
    return { 
      league, 
      users: validUsers, 
      rosters: validRosters 
    };
  } catch (error) {
    console.error(`Erro ao buscar dados da liga ${leagueId}:`, error);
    // Retornar dados vazios em caso de erro para evitar quebrar a aplicação
    return {
      league: null,
      users: [],
      rosters: []
    };
  }
}

// Mapeia dados do Sleeper para o formato interno
export function mapSleeperDataToTeams(
  users: SleeperUser[],
  rosters: SleeperRoster[]
): Omit<Team, 'rank'>[] {
  // Validação de entrada - garantir que users é um array
  if (!Array.isArray(users)) {
    console.warn('Users não é um array:', users);
    users = [];
  }
  
  // Validação de entrada - garantir que rosters é um array
  if (!Array.isArray(rosters)) {
    console.warn('Rosters não é um array:', rosters);
    return [];
  }
  
  // Cria mapa de owner_id -> display_name
  const userMap = new Map<string, string>();
  users.forEach(user => {
    if (user && user.user_id) {
      const displayName = user.display_name || user.username || 'Desconhecido';
      userMap.set(user.user_id, displayName);
    }
  });
  
  return rosters
    .filter(roster => roster && roster.roster_id !== undefined) // Filtrar rosters inválidos
    .map(roster => {
      const displayName = userMap.get(roster.owner_id) || 'Desconhecido';
      
      // Validar se settings existe e tem as propriedades necessárias
      const settings = roster.settings || {};
      const wins = settings.wins || 0;
      const losses = settings.losses || 0;
      const ties = settings.ties || 0;
      
      // Combinar valores inteiros com decimais para formar o valor completo
      const fpts = (settings.fpts || 0) + ((settings.fpts_decimal || 0) / 100);
      const fpts_against = (settings.fpts_against || 0) + ((settings.fpts_against_decimal || 0) / 100);
      
      // Calcula streak (simplificado - apenas mostra W/L baseado no último resultado)
      const totalGames = wins + losses + ties;
      let streak = '-';
      if (totalGames > 0) {
        // Simplificado: assume que o último jogo foi uma vitória se wins > losses
        streak = wins >= losses ? 'W1' : 'L1';
      }
      
      return {
        rosterId: roster.roster_id,
        ownerId: roster.owner_id || 'unknown',
        displayName,
        wins,
        losses,
        ties,
        pointsFor: fpts ? parseFloat(fpts.toFixed(2)) : 0,
        pointsAgainst: fpts_against ? parseFloat(fpts_against.toFixed(2)) : 0,
        streak
      };
    });
}

// Função para calcular o streak real baseado no histórico de matchups
export async function calculateRealStreak(
  rosterId: number, 
  leagueId: string, 
  currentWeek: number
): Promise<string> {
  try {
    const baseUrl = 'https://api.sleeper.app/v1';
    const streakResults: ('W' | 'L' | 'T')[] = [];
    
    // Analisar as últimas 10 semanas (ou até a semana 1)
    const startWeek = Math.max(1, currentWeek - 10);
    
    for (let week = currentWeek - 1; week >= startWeek; week--) {
      try {
        const matchups = await fetchJSON<SleeperMatchup[]>(
          `${baseUrl}/league/${leagueId}/matchups/${week}`,
          { 
            revalidate: 300, // Cache por 5 minutos
            cacheKey: `matchups-${leagueId}-${week}` 
          }
        );
        
        if (!Array.isArray(matchups)) continue;
        
        // Encontrar o matchup do time
        const teamMatchup = matchups.find(m => m.roster_id === rosterId);
        if (!teamMatchup) continue;
        
        // Encontrar o oponente no mesmo matchup_id
        const opponentMatchup = matchups.find(
          m => m.matchup_id === teamMatchup.matchup_id && m.roster_id !== rosterId
        );
        
        if (!opponentMatchup) continue;
        
        // Determinar resultado
        if (teamMatchup.points > opponentMatchup.points) {
          streakResults.unshift('W'); // Adiciona no início para manter ordem cronológica
        } else if (teamMatchup.points < opponentMatchup.points) {
          streakResults.unshift('L');
        } else {
          streakResults.unshift('T');
        }
        
        // Se mudou o tipo de resultado, parar (encontrou o fim do streak)
        if (streakResults.length > 1) {
          const lastResult = streakResults[streakResults.length - 1];
          const currentResult = streakResults[streakResults.length - 2];
          if (lastResult !== currentResult) {
            // Remove o resultado diferente e para
            streakResults.pop();
            break;
          }
        }
      } catch (weekError) {
        console.warn(`Erro ao buscar matchups da semana ${week}:`, weekError);
        continue;
      }
    }
    
    // Se não encontrou nenhum resultado, retorna padrão
    if (streakResults.length === 0) {
      return '-';
    }
    
    // Contar streak atual (todos os resultados devem ser iguais)
    const streakType = streakResults[streakResults.length - 1];
    const streakCount = streakResults.length;
    
    return `${streakType}${streakCount}`;
    
  } catch (error) {
    console.warn(`Erro ao calcular streak para roster ${rosterId}:`, error);
    return '-';
  }
}

// Função para mapear dados do Sleeper para times com streak real
export async function mapSleeperDataToTeamsWithStreak(
  users: SleeperUser[],
  rosters: SleeperRoster[],
  leagueId: string,
  currentWeek: number
): Promise<Omit<Team, 'rank'>[]> {
  const teams = await Promise.all(
    rosters.map(async (roster) => {
      const user = users.find(u => u.user_id === roster.owner_id);
      const displayName = user?.display_name || user?.username || `Team ${roster.roster_id}`;
      
      const { settings } = roster;
      const wins = settings.wins || 0;
      const losses = settings.losses || 0;
      const ties = settings.ties || 0;
      
      const fpts = (settings.fpts || 0) + ((settings.fpts_decimal || 0) / 100);
      const fpts_against = (settings.fpts_against || 0) + ((settings.fpts_against_decimal || 0) / 100);
      
      // Calcular streak real baseado no histórico de matchups
      const streak = await calculateRealStreak(roster.roster_id, leagueId, currentWeek);
      
      return {
        rosterId: roster.roster_id,
        ownerId: roster.owner_id || 'unknown',
        displayName,
        wins,
        losses,
        ties,
        pointsFor: fpts ? parseFloat(fpts.toFixed(2)) : 0,
        pointsAgainst: fpts_against ? parseFloat(fpts_against.toFixed(2)) : 0,
        streak
      };
    })
  );
  
  return teams;
}