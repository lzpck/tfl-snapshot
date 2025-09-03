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
  };
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

// Sistema de cache in-memory
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  
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
    
    return entry.data;
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
    // Adiciona cache do Next.js se não houver cache customizado
    next: revalidate ? undefined : { revalidate: 60 }
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
  
  const [league, users, rosters] = await Promise.all([
    fetchJSON<SleeperLeague>(`${baseUrl}/league/${leagueId}`, cacheOptions),
    fetchJSON<SleeperUser[]>(`${baseUrl}/league/${leagueId}/users`, cacheOptions),
    fetchJSON<SleeperRoster[]>(`${baseUrl}/league/${leagueId}/rosters`, cacheOptions)
  ]);
  
  return { league, users, rosters };
}

// Mapeia dados do Sleeper para o formato interno
export function mapSleeperDataToTeams(
  users: SleeperUser[],
  rosters: SleeperRoster[]
): Omit<Team, 'rank'>[] {
  // Cria mapa de owner_id -> display_name
  const userMap = new Map<string, string>();
  users.forEach(user => {
    userMap.set(user.user_id, user.display_name || user.username || 'Desconhecido');
  });
  
  return rosters.map(roster => {
    const displayName = userMap.get(roster.owner_id) || 'Desconhecido';
    
    // Calcula streak (simplificado - apenas mostra W/L baseado no último resultado)
    const totalGames = roster.settings.wins + roster.settings.losses + roster.settings.ties;
    let streak = '-';
    if (totalGames > 0) {
      // Simplificado: assume que o último jogo foi uma vitória se wins > losses
      streak = roster.settings.wins >= roster.settings.losses ? 'W1' : 'L1';
    }
    
    return {
      rosterId: roster.roster_id,
      ownerId: roster.owner_id,
      displayName,
      wins: roster.settings.wins,
      losses: roster.settings.losses,
      ties: roster.settings.ties,
      pointsFor: roster.settings.fpts ? Math.round(roster.settings.fpts * 100) / 100 : 0,
      pointsAgainst: roster.settings.fpts_against ? Math.round(roster.settings.fpts_against * 100) / 100 : 0,
      streak
    };
  });
}