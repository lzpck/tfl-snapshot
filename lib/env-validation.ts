/**
 * Validação e configuração das variáveis de ambiente
 * Este módulo centraliza a validação e fornece acesso tipado às variáveis de ambiente
 */

// Interface para as configurações de liga
export interface LeagueConfig {
  // Ligas principais (atuais)
  redraft: string;
  dynasty: string;
  
  // Ligas históricas
  historical: {
    redraft: {
      2022: string;
      2023: string;
      2024: string;
    };
    dynasty: {
      2024: string;
      2025: string;
    };
  };
}

// Interface para configurações de ambiente
export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  appEnv: string;
  timezone: string;
  cache: {
    ttl: number;
    enabled: boolean;
  };
  debug: {
    logs: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

// Função para validar se uma variável de ambiente é um ID de liga válido
function validateLeagueId(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${name}`);
  }
  
  // Validar formato do ID (deve ser um número de 16-20 dígitos)
  const leagueIdRegex = /^\d{16,20}$/;
  if (!leagueIdRegex.test(value)) {
    throw new Error(`ID de liga inválido para ${name}: ${value}. Deve ser um número de 16-20 dígitos.`);
  }
  
  return value;
}

// Função para validar variáveis opcionais com valor padrão
function getEnvWithDefault<T>(
  key: string, 
  defaultValue: T, 
  parser?: (value: string) => T
): T {
  const value = process.env[key];
  
  if (!value) {
    return defaultValue;
  }
  
  if (parser) {
    try {
      return parser(value);
    } catch {
      console.warn(`Erro ao parsear ${key}: ${value}. Usando valor padrão: ${defaultValue}`);
      return defaultValue;
    }
  }
  
  return value as T;
}

// Função para validar configurações de liga
export function validateLeagueConfig(): LeagueConfig {
  try {
    return {
      // Ligas principais (obrigatórias)
      redraft: validateLeagueId(process.env.LEAGUE_ID_REDRAFT, 'LEAGUE_ID_REDRAFT'),
      dynasty: validateLeagueId(process.env.LEAGUE_ID_DYNASTY, 'LEAGUE_ID_DYNASTY'),
      
      // Ligas históricas (opcionais, mas recomendadas)
      historical: {
        redraft: {
          2022: getEnvWithDefault('LEAGUE_ID_REDRAFT_2022', ''),
          2023: getEnvWithDefault('LEAGUE_ID_REDRAFT_2023', ''),
          2024: getEnvWithDefault('LEAGUE_ID_REDRAFT_2024', ''),
        },
        dynasty: {
          2024: getEnvWithDefault('LEAGUE_ID_DYNASTY_2024', ''),
          2025: getEnvWithDefault('LEAGUE_ID_DYNASTY_2025', ''),
        },
      },
    };
  } catch (error) {
    console.error('❌ Erro na validação das configurações de liga:', error);
    throw error;
  }
}

// Função para validar configurações gerais da aplicação
export function validateAppConfig(): AppConfig {
  return {
    nodeEnv: getEnvWithDefault('NODE_ENV', 'development') as 'development' | 'production' | 'test',
    appEnv: getEnvWithDefault('NEXT_PUBLIC_APP_ENV', 'development'),
    timezone: getEnvWithDefault('TZ', 'America/New_York'),
    
    cache: {
      ttl: getEnvWithDefault('CACHE_TTL', 300, (value) => {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed) || parsed < 0) {
          throw new Error('CACHE_TTL deve ser um número positivo');
        }
        return parsed;
      }),
      enabled: getEnvWithDefault('ENABLE_CACHE', true, (value) => {
        return value.toLowerCase() === 'true';
      }),
    },
    
    debug: {
      logs: getEnvWithDefault('DEBUG_LOGS', false, (value) => {
        return value.toLowerCase() === 'true';
      }),
      logLevel: getEnvWithDefault('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug',
    },
  };
}

// Função principal de validação que executa todas as validações
export function validateEnvironment(): { leagues: LeagueConfig; app: AppConfig } {
  console.log('🔍 Validando variáveis de ambiente...');
  
  try {
    const leagues = validateLeagueConfig();
    const app = validateAppConfig();
    
    console.log('✅ Validação das variáveis de ambiente concluída com sucesso');
    console.log(`📊 Ligas configuradas: Redraft (${leagues.redraft}), Dynasty (${leagues.dynasty})`);
    console.log(`⚙️ Ambiente: ${app.nodeEnv}, Cache: ${app.cache.enabled ? 'habilitado' : 'desabilitado'}`);
    
    return { leagues, app };
  } catch (error) {
    console.error('🚨 ERRO CRÍTICO: Falha na validação das variáveis de ambiente');
    console.error('📋 Verifique se o arquivo .env está configurado corretamente');
    console.error('📖 Consulte o README.md para instruções de configuração');
    throw error;
  }
}

// Função utilitária para obter ID de liga por tipo
export function getLeagueId(type: 'redraft' | 'dynasty', config?: LeagueConfig): string {
  const leagues = config || validateLeagueConfig();
  return leagues[type];
}

// Função utilitária para obter ID de liga histórica
export function getHistoricalLeagueId(
  type: 'redraft' | 'dynasty', 
  year: number, 
  config?: LeagueConfig
): string | null {
  const leagues = config || validateLeagueConfig();
  
  if (type === 'redraft') {
    switch (year) {
      case 2022: return leagues.historical.redraft[2022] || null;
      case 2023: return leagues.historical.redraft[2023] || null;
      case 2024: return leagues.historical.redraft[2024] || null;
      default: return null;
    }
  } else if (type === 'dynasty') {
    switch (year) {
      case 2024: return leagues.historical.dynasty[2024] || null;
      default: return null;
    }
  }
  
  return null;
}

// Exportar configurações validadas como constantes (lazy loading)
let _validatedConfig: { leagues: LeagueConfig; app: AppConfig } | null = null;

export function getValidatedConfig(): { leagues: LeagueConfig; app: AppConfig } {
  if (!_validatedConfig) {
    _validatedConfig = validateEnvironment();
  }
  return _validatedConfig;
}

// Exportar configurações individuais
export const getLeagueConfig = (): LeagueConfig => getValidatedConfig().leagues;
export const getAppConfig = (): AppConfig => getValidatedConfig().app;