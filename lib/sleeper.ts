export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  previous_league_id?: string;
  settings: {
    week?: number;
    playoff_week_start?: number;
  };
}

export interface SleeperUser {
  user_id: string;
  display_name: string;
  username: string;
  avatar?: string;
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
    ppts?: number;
    ppts_decimal?: number;
  };
}

// Interface para matchups do Sleeper
export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
}

export interface SleeperBracketMatch {
  r: number;      // Round
  m: number;      // Match ID
  t1: number | null; // Roster ID 1 (pode ser null se TBD)
  t2: number | null; // Roster ID 2 (pode ser null se TBD)
  w: number | null; // Winner Roster ID
  l: number | null; // Loser Roster ID
  t1_from?: { w?: number; l?: number } | null;
  t2_from?: { w?: number; l?: number } | null;
  p?: number; // Position (1st, 3rd, 5th etc) - inferred field
  id?: number | string; // Optional unique ID if available
}

export interface Team {
  rank: number;
  rosterId: number;
  ownerId: string;
  displayName: string;
  avatarUrl?: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  ppts: number;
}

// Interface para o estado atual da NFL
export interface SleeperNFLState {
  season?: string;
  week: number;
  display_week: number;
  season_type: string;
  leg: number;
}

export interface SleeperDraft {
  draft_id: string;
  league_id: string;
  season: string;
  status: 'pre_draft' | 'drafting' | 'complete';
  type: string;
  settings: {
    rounds: number;
    slots_bn: number;
    slots_flex: number;
    teams: number;
  };
  draft_order: Record<string, number> | null; // userid -> order
  slot_to_roster_id: Record<string, number> | null;
  season_type: string;
  start_time: number;
  last_picked: number;
}

export interface SleeperDraftPick {
  round: number;
  roster_id: number;
  player_id: string;
  picked_by: string;
  draft_id: string;
  pick_no: number;
  metadata: {
    first_name: string;
    last_name: string;
    position: string;
    team: string;
    status: string;
    sport: string;
    number: string;
    player_id: string;
  };
}

export interface SleeperTradedPick {
  season: string;
  round: number;
  roster_id: number; // original owner roster id
  owner_id: number; // current owner roster id
  previous_owner_id: number;
}

// Sistema de cache in-memory
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
    // Limpar requisições pendentes após salvar no cache
    this.pendingRequests.delete(key);
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
  
  // Método para evitar requisições duplicadas
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number): Promise<T> {
    // Verificar cache primeiro
    const cached = this.get<T>(key);
    if (cached) {
      return cached;
    }
    
    // Verificar se já há uma requisição pendente para esta chave
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`[CACHE] Aguardando requisição pendente para: ${key}`);
      return pending as Promise<T>;
    }
    
    // Criar nova requisição e armazenar como pendente
    console.log(`[CACHE] Iniciando nova requisição para: ${key}`);
    const promise = fetchFn().then(data => {
      this.set(key, data, ttlSeconds);
      return data;
    }).catch(error => {
      // Remover da lista de pendentes em caso de erro
      this.pendingRequests.delete(key);
      throw error;
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Instância global do cache
const memoryCache = new MemoryCache();

// Exportar o cache para permitir limpeza externa
if (typeof global !== 'undefined') {
  global.memoryCache = memoryCache;
}

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
  
  // Se TTL foi especificado, usar o método getOrFetch para evitar condições de corrida
  if (revalidate) {
    return memoryCache.getOrFetch<T>(finalCacheKey, async () => {
      console.log(`[FETCH] Buscando dados da API: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TFLSnapshot/1.0'
        },
        next: { revalidate }
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API do Sleeper: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[FETCH] Dados recebidos com sucesso de: ${url}`);
      return data;
    }, revalidate);
  }
  
  // Fallback para requisições sem cache
  console.log(`[FETCH] Requisição sem cache para: ${url}`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TFLSnapshot/1.0'
    },
    next: { revalidate: 60 }
  });
  
  if (!response.ok) {
    throw new Error(`Erro na API do Sleeper: ${response.status}`);
  }
  
  return response.json();
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
  const timestamp = new Date().toISOString();
  
  console.log(`[LEAGUE_DATA ${timestamp}] Iniciando busca de dados para liga: ${leagueId}`);
  
  const leagueCacheOptions = useCache ? {
    revalidate: cacheConfig.standingsTTL,
    cacheKey: `league-info-${leagueId}`
  } : {};
  
  const usersCacheOptions = useCache ? {
    revalidate: cacheConfig.standingsTTL,
    cacheKey: `league-users-${leagueId}`
  } : {};
  
  const rostersCacheOptions = useCache ? {
    revalidate: cacheConfig.standingsTTL,
    cacheKey: `league-rosters-${leagueId}`
  } : {};
  
  try {
    const [league, users, rosters] = await Promise.all([
      fetchJSON<SleeperLeague>(`${baseUrl}/league/${leagueId}`, leagueCacheOptions),
      fetchJSON<SleeperUser[]>(`${baseUrl}/league/${leagueId}/users`, usersCacheOptions),
      fetchJSON<SleeperRoster[]>(`${baseUrl}/league/${leagueId}/rosters`, rostersCacheOptions)
    ]);
    
    // Validar dados retornados
    if (!league) {
      throw new Error(`Liga não encontrada: ${leagueId}`);
    }
    
    // Garantir que users e rosters são arrays válidos
    const validUsers = Array.isArray(users) ? users.filter(user => user && user.user_id) : [];
    const validRosters = Array.isArray(rosters) ? rosters.filter(roster => roster && roster.roster_id !== undefined) : [];
    
    console.log(`[LEAGUE_DATA ${timestamp}] Dados iniciais - Usuários: ${validUsers.length}, Rosters: ${validRosters.length}`);
    
    if (validUsers.length === 0) {
      console.warn(`[LEAGUE_DATA ${timestamp}] ⚠️ Nenhum usuário válido encontrado para a liga ${leagueId}`);
    }
    
    if (validRosters.length === 0) {
      console.warn(`[LEAGUE_DATA ${timestamp}] ⚠️ Nenhum roster válido encontrado para a liga ${leagueId}`);
    }
    
    // Verificar correspondências e buscar usuários órfãos
    if (validUsers.length > 0 && validRosters.length > 0) {
      const userIds = new Set(validUsers.map(u => u.user_id));
      const ownerIds = validRosters.map(r => r.owner_id);
      const unmatchedOwners = ownerIds.filter(ownerId => !userIds.has(ownerId));
      
      console.log(`[LEAGUE_DATA ${timestamp}] Verificação de correspondências - Owner IDs órfãos: ${unmatchedOwners.length}`);
      
      if (unmatchedOwners.length > 0) {
        console.warn(`[LEAGUE_DATA ${timestamp}] ⚠️ Owner IDs sem usuário correspondente:`, unmatchedOwners);
        
        // Tentar buscar dados de usuários órfãos
        console.log(`[LEAGUE_DATA ${timestamp}] Tentando buscar dados de usuários órfãos...`);
        for (const ownerId of unmatchedOwners) {
          try {
            const orphanUser = await fetchJSON<SleeperUser>(`${baseUrl}/user/${ownerId}`, {
              revalidate: useCache ? cacheConfig.standingsTTL : 0,
              cacheKey: `user-${ownerId}`
            });
            if (orphanUser && orphanUser.user_id) {
              console.log(`[LEAGUE_DATA ${timestamp}] ✅ Usuário órfão encontrado: ${ownerId} -> "${orphanUser.display_name || orphanUser.username}"`);
              validUsers.push(orphanUser);
            } else {
              console.warn(`[LEAGUE_DATA ${timestamp}] ⚠️ Dados inválidos para usuário órfão ${ownerId}:`, orphanUser);
            }
          } catch (err) {
            console.error(`[LEAGUE_DATA ${timestamp}] ❌ Erro ao buscar usuário órfão ${ownerId}:`, err);
          }
        }
      }
    }
    
    // Validação final: verificar se ainda há owner_ids sem correspondência
    const finalUserIds = new Set(validUsers.map(u => u.user_id));
    const finalOwnerIds = validRosters.map(r => r.owner_id);
    const stillUnmatched = finalOwnerIds.filter(ownerId => !finalUserIds.has(ownerId));
    
    if (stillUnmatched.length > 0) {
      console.error(`[LEAGUE_DATA ${timestamp}] 🚨 ALERTA CRÍTICO: ${stillUnmatched.length} owner IDs ainda sem correspondência após busca de órfãos:`, stillUnmatched);
      
      // Se ainda há usuários não correspondidos e não estamos usando cache, tentar uma segunda vez
      if (!useCache && stillUnmatched.length > 0) {
        console.log(`[LEAGUE_DATA ${timestamp}] Tentando segunda busca sem cache para usuários órfãos...`);
        for (const ownerId of stillUnmatched) {
          try {
            const retryUser = await fetchJSON<SleeperUser>(`${baseUrl}/user/${ownerId}`, { 
              revalidate: 0,
              cacheKey: `user-retry-${ownerId}`
            });
            if (retryUser && retryUser.user_id) {
              console.log(`[LEAGUE_DATA ${timestamp}] ✅ Usuário encontrado na segunda tentativa: ${ownerId} -> "${retryUser.display_name || retryUser.username}"`);
              validUsers.push(retryUser);
            }
          } catch (err) {
            console.error(`[LEAGUE_DATA ${timestamp}] ❌ Segunda tentativa falhou para ${ownerId}:`, err);
          }
        }
      }
    }
    
    console.log(`[LEAGUE_DATA ${timestamp}] ✅ Dados finais - Usuários: ${validUsers.length}, Rosters: ${validRosters.length}`);
    
    return { 
      league, 
      users: validUsers, 
      rosters: validRosters 
    };
  } catch (error) {
    console.error(`[LEAGUE_DATA ${timestamp}] ❌ Erro ao buscar dados da liga ${leagueId}:`, error);
    // Retornar dados vazios em caso de erro para evitar quebrar a aplicação
    return {
      league: null,
      users: [],
      rosters: []
    };
  }
}

// Função para mapear dados do Sleeper para times
export function mapSleeperDataToTeams(
  users: SleeperUser[],
  rosters: SleeperRoster[]
): Omit<Team, 'rank'>[] {
  const timestamp = new Date().toISOString();
  console.log(`[MAPPING ${timestamp}] Iniciando mapeamento de dados`);
  console.log(`[MAPPING ${timestamp}] Usuários recebidos: ${users?.length || 0}`);
  console.log(`[MAPPING ${timestamp}] Rosters recebidos: ${rosters?.length || 0}`);
  
  // Validação de entrada - garantir que users é um array
  if (!Array.isArray(users)) {
    console.warn(`[MAPPING ${timestamp}] ⚠️ Users não é um array:`, users);
    users = [];
  }
  
  // Validação de entrada - garantir que rosters é um array
  if (!Array.isArray(rosters)) {
    console.warn(`[MAPPING ${timestamp}] ⚠️ Rosters não é um array:`, rosters);
    return [];
  }
  
  // Cria mapa de owner_id -> display_name com validação mais robusta
  const userMap = new Map<string, string>();
  users.forEach(user => {
    if (user && user.user_id) {
      // Validação mais robusta para display_name
      let displayName = '';
      
      // Primeiro, tentar display_name (verificando se não é vazio)
      if (user.display_name && user.display_name.trim().length > 0) {
        displayName = user.display_name.trim();
      }
      // Se display_name estiver vazio, tentar username
      else if (user.username && user.username.trim().length > 0) {
        displayName = user.username.trim();
      }
      // Último recurso: usar o user_id como identificador
      else {
        displayName = `Usuário ${user.user_id.slice(-6)}`;
        console.warn(`[MAPPING ${timestamp}] ⚠️ Usando nome genérico para user_id ${user.user_id}: ${displayName}`);
      }
      
      userMap.set(user.user_id, displayName);
      console.log(`[MAPPING ${timestamp}] Mapeado: ${user.user_id} -> "${displayName}"`);
    }
  });
  
  // Log para debug quando há problemas de mapeamento
  if (userMap.size === 0 && users.length > 0) {
    console.error(`[MAPPING ${timestamp}] 🚨 PROBLEMA CRÍTICO: Nenhum usuário foi mapeado corretamente. Dados dos usuários:`, users);
  }
  
  const mappedTeams = rosters
    .filter(roster => roster && roster.roster_id !== undefined) // Filtrar rosters inválidos
    .map(roster => {
      let displayName = userMap.get(roster.owner_id);
      let nameSource = 'userMap';
      
      let matchingUser: SleeperUser | undefined;

      // Se não encontrou o usuário no mapa, tentar estratégias alternativas
      if (displayName) {
        // Encontrar usuário correspondente para obter avatar
        matchingUser = users.find(u => u.user_id === roster.owner_id);
      } else {
        console.warn(`[MAPPING ${timestamp}] ⚠️ Usuário não encontrado para owner_id: ${roster.owner_id}. Tentando estratégias alternativas.`);
        
        // Tentar encontrar por correspondência parcial ou outros métodos
        matchingUser = users.find(user => 
          user && (
            user.user_id === roster.owner_id ||
            user.username === roster.owner_id ||
            user.display_name === roster.owner_id
          )
        );
        
        if (matchingUser) {
          displayName = matchingUser.display_name?.trim() || 
                      matchingUser.username?.trim() || 
                      `Usuário ${matchingUser.user_id.slice(-6)}`;
          nameSource = 'alternativeMatch';
          console.log(`[MAPPING ${timestamp}] ✅ Encontrado usuário por correspondência alternativa: ${displayName}`);
        } else {
          // Último recurso: usar o owner_id como base para o nome
          displayName = `Time ${roster.owner_id?.slice(-6) || roster.roster_id}`;
          nameSource = 'generic';
          console.error(`[MAPPING ${timestamp}] 🚨 NOME GENÉRICO CRIADO para roster ${roster.roster_id}: "${displayName}" (owner_id: ${roster.owner_id})`);
        }
      }
      
      // Validar se settings existe e tem as propriedades necessárias
      const settings = roster.settings || {};
      const wins = settings.wins || 0;
      const losses = settings.losses || 0;
      const ties = settings.ties || 0;
      
      // Combinar valores inteiros com decimais para formar o valor completo
      const fpts = (settings.fpts || 0) + ((settings.fpts_decimal || 0) / 100);
      const fpts_against = (settings.fpts_against || 0) + ((settings.fpts_against_decimal || 0) / 100);
      const ppts = (settings.ppts || 0) + ((settings.ppts_decimal || 0) / 100);
      
      const team: Team = {
        rank: 0, // Será preenchido posteriormente
        rosterId: roster.roster_id,
        ownerId: roster.owner_id || 'unknown',
        displayName: displayName || `Time ${roster.roster_id}`,
        avatarUrl: matchingUser?.avatar ? `https://sleepercdn.com/avatars/${matchingUser.avatar}` : undefined,
        wins,
        losses,
        ties,
        pointsFor: fpts ? parseFloat(fpts.toFixed(2)) : 0,
        pointsAgainst: fpts_against ? parseFloat(fpts_against.toFixed(2)) : 0,
        ppts: ppts ? parseFloat(ppts.toFixed(2)) : 0
      };
      
      // Log detalhado para cada time mapeado
      console.log(`[MAPPING ${timestamp}] Time mapeado - Roster: ${team.rosterId}, Owner: ${team.ownerId}, Nome: "${team.displayName}" (fonte: ${nameSource})`);
      
      return team;
    });
  
  console.log(`[MAPPING ${timestamp}] ✅ Mapeamento concluído: ${mappedTeams.length} times processados`);
  
  // Verificar se há nomes genéricos no resultado final
  const genericNames = mappedTeams.filter(team => team.displayName.startsWith('Time '));
  if (genericNames.length > 0) {
    console.error(`[MAPPING ${timestamp}] 🚨 ALERTA: ${genericNames.length} times com nomes genéricos detectados:`, 
      genericNames.map(t => `Roster ${t.rosterId}: "${t.displayName}"`));
  }
  
  return mappedTeams;
}

// Busca a chave dos playoffs (winners bracket)
export async function fetchWinnersBracket(leagueId: string, useCache = true): Promise<SleeperBracketMatch[]> {
  const baseUrl = 'https://api.sleeper.app/v1';
  const cacheConfig = getCacheConfig();
  
  const cacheOptions = useCache ? {
    revalidate: cacheConfig.matchupsTTL,
    cacheKey: `bracket-winners-${leagueId}`
  } : {};
  
  try {
    const bracket = await fetchJSON<SleeperBracketMatch[]>(`${baseUrl}/league/${leagueId}/winners_bracket`, cacheOptions);
    return bracket || [];
  } catch (error) {
    console.error(`Erro ao buscar bracket da liga ${leagueId}:`, error);
    return [];
  }
}

// Busca os confrontos diretos de uma semana específica com pontuação
export async function fetchMatchups(leagueId: string, week: number, useCache = true): Promise<SleeperMatchup[]> {
  const baseUrl = 'https://api.sleeper.app/v1';
  const cacheConfig = getCacheConfig();
  
  const cacheOptions = useCache ? {
    revalidate: cacheConfig.matchupsTTL,
    cacheKey: `matchups-${leagueId}-week-${week}`
  } : {};
  
  try {
    const matchups = await fetchJSON<SleeperMatchup[]>(`${baseUrl}/league/${leagueId}/matchups/${week}`, cacheOptions);
    return matchups || [];
  } catch (error) {
    console.error(`Erro ao buscar matchups da liga ${leagueId} semana ${week}:`, error);
    return [];
  }
}

// Busca os drafts de uma liga
export async function fetchDrafts(leagueId: string, useCache = true): Promise<SleeperDraft[]> {
  const baseUrl = 'https://api.sleeper.app/v1';
  // const cacheConfig = getCacheConfig(); // Unused
  
  const cacheOptions = useCache ? {
    revalidate: 60, // Usar revalidate fixo para drafts por enquanto ou getCacheConfig().matchupsTTL se precisar
    cacheKey: `drafts-${leagueId}`
  } : {};
  
  try {
    const drafts = await fetchJSON<SleeperDraft[]>(`${baseUrl}/league/${leagueId}/drafts`, cacheOptions);
    return drafts || [];
  } catch (error) {
    console.error(`Erro ao buscar drafts da liga ${leagueId}:`, error);
    return [];
  }
}

// Busca picks já realizadas em um draft
export async function fetchDraftPicks(draftId: string, useCache = true): Promise<SleeperDraftPick[]> {
  const baseUrl = 'https://api.sleeper.app/v1';
  // const cacheConfig = getCacheConfig(); // Unused
  
  const cacheOptions = useCache ? {
    revalidate: 60,
    cacheKey: `draft-picks-${draftId}`
  } : {};
  
  try {
    const picks = await fetchJSON<SleeperDraftPick[]>(`${baseUrl}/draft/${draftId}/picks`, cacheOptions);
    return picks || [];
  } catch (error) {
    console.error(`Erro ao buscar picks do draft ${draftId}:`, error);
    return [];
  }
}

// Busca picks trocadas em um draft específico
export async function fetchTradedPicks(draftId: string, useCache = true): Promise<SleeperTradedPick[]> {
  const baseUrl = 'https://api.sleeper.app/v1';
  // const cacheConfig = getCacheConfig(); // Unused
  
  const cacheOptions = useCache ? {
    revalidate: 60,
    cacheKey: `draft-traded-picks-${draftId}`
  } : {};
  
  try {
    const tradedPicks = await fetchJSON<SleeperTradedPick[]>(`${baseUrl}/draft/${draftId}/traded_picks`, cacheOptions);
    return tradedPicks || [];
  } catch (error) {
    console.error(`Erro ao buscar traded picks do draft ${draftId}:`, error);
    return [];
  }
}

// Busca recursivamente o histórico de ligas anteriores
export async function fetchLeagueHistory(currentLeagueId: string): Promise<Record<string, string>> {
  const history: Record<string, string> = {};
  let nextLeagueId: string | undefined = currentLeagueId;
  
  const baseUrl = 'https://api.sleeper.app/v1';

  console.log(`[HISTORY] Iniciando busca recursiva de histórico partindo de: ${currentLeagueId}`);

  // Limite de segurança para recursão
  let attempts = 0;
  const MAX_ATTEMPTS = 15; // Aumentado para cobrir mais anos se necessário

  while (nextLeagueId && attempts < MAX_ATTEMPTS) {
    try {
      // Usar cache longo para histórico de ligas, pois IDs antigos não mudam
      const leagueData: SleeperLeague = await fetchJSON<SleeperLeague>(
        `${baseUrl}/league/${nextLeagueId}`, 
        {
          revalidate: 86400, // 24 horas de cache para estrutura da liga
          cacheKey: `league-basic-${nextLeagueId}`
        }
      );

      if (leagueData) {
        history[leagueData.season] = leagueData.league_id;
        
        // Preparar para próxima iteração
        nextLeagueId = leagueData.previous_league_id;
        
        // Se a próxima já estiver no histórico (ciclo), parar
        if (nextLeagueId && Object.values(history).includes(nextLeagueId)) {
          console.warn(`[HISTORY] Ciclo detectado no histórico de ligas. Parando.`);
          break;
        }
      } else {
        console.warn(`[HISTORY] Liga ${nextLeagueId} não retornou dados.`);
        break;
      }
    } catch (error) {
      console.error(`[HISTORY] Erro ao buscar liga ${nextLeagueId}:`, error);
      break;
    }
    
    attempts++;
  }

  return history;
}