# TFL Snapshot 📊

Uma aplicação Next.js moderna para acompanhamento de ligas de fantasy football, com foco em standings e matchups para ligas Redraft e Dynasty.

## 🚀 Funcionalidades

- **Standings Dinâmicos**: Visualização completa das classificações das ligas
- **Sistema de Matchups**: Pareamento inteligente de times baseado em regras específicas
- **Suporte a Ligas Dynasty e Redraft**: Algoritmos otimizados para cada tipo de liga
- **PWA (Progressive Web App)**: Funciona offline e pode ser instalada como app
- **Tema Dark/Light**: Suporte automático às preferências do sistema
- **Cache Inteligente**: Sistema de cache otimizado para APIs do Sleeper
- **Responsivo**: Interface adaptável para desktop e mobile

## 🛠️ Tecnologias

- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática para maior segurança
- **Tailwind CSS**: Framework CSS utilitário
- **PWA**: Implementado com @ducanh2912/next-pwa
- **Sleeper API**: Integração com a API oficial do Sleeper
- **Vercel**: Plataforma de deploy otimizada

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/tfl-snapshot.git
cd tfl-snapshot
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Execute o projeto em desenvolvimento:
```bash
pnpm dev
```

5. Acesse `http://localhost:3000`

## ⚙️ Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

#### 📋 Configuração Inicial

1. **Copie o arquivo de exemplo:**
```bash
cp .env.example .env
```

2. **Configure os IDs das suas ligas no arquivo `.env`:**

#### 🏈 Ligas Principais (Obrigatórias)

```env
# Liga Redraft - Liga principal de redraft (renovação anual)
# Utilizada para matchups e standings da temporada atual
LEAGUE_ID_REDRAFT=seu_id_da_liga_redraft

# Liga Dynasty - Liga principal de dynasty (times permanentes)  
# Utilizada para matchups e standings da temporada atual
LEAGUE_ID_DYNASTY=seu_id_da_liga_dynasty
```

#### 📚 Ligas Históricas (Opcionais)

```env
# IDs das ligas redraft de temporadas anteriores
# Utilizadas na seção de histórico da aplicação
LEAGUE_ID_REDRAFT_2022=id_da_liga_redraft_2022
LEAGUE_ID_REDRAFT_2023=id_da_liga_redraft_2023
LEAGUE_ID_REDRAFT_2024=id_da_liga_redraft_2024

# IDs das ligas dynasty de temporadas anteriores
LEAGUE_ID_DYNASTY_2024=id_da_liga_dynasty_2024
```

#### ⚙️ Configurações Adicionais (Opcionais)

```env
# Ambiente de execução
NODE_ENV=development

# Fuso horário para cálculos de tempo
TZ=America/New_York

# Configurações de cache
CACHE_TTL=300
ENABLE_CACHE=true

# Configurações de debug
DEBUG_LOGS=false
LOG_LEVEL=info
```

#### 🔍 Como Encontrar o ID da Liga no Sleeper

1. Acesse sua liga no Sleeper (web ou app)
2. Na URL da liga, o ID é o número longo após `/league/`
   - Exemplo: `https://sleeper.app/leagues/1180180342143975424/team`
   - ID da liga: `1180180342143975424`

#### ✅ Validação das Configurações

A aplicação possui validação automática das variáveis de ambiente:

- **IDs de Liga**: Devem ser números de 16-20 dígitos
- **Configurações Obrigatórias**: `LEAGUE_ID_REDRAFT` e `LEAGUE_ID_DYNASTY`
- **Fallbacks**: Valores padrão para configurações opcionais
- **Logs de Erro**: Mensagens detalhadas em caso de configuração inválida

#### 🚨 Importante

- **Nunca commite o arquivo `.env`** - ele já está no `.gitignore`
- **Use o `.env.example`** como referência para a estrutura
- **IDs inválidos** resultarão em erro na inicialização da aplicação

### Deploy no Vercel

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. O deploy será automático a cada push na branch main

## 📁 Estrutura do Projeto

```
tfl-snapshot/
├── app/                    # App Router do Next.js
│   ├── api/               # Rotas da API
│   ├── components/        # Componentes React
│   ├── matchups/         # Páginas de matchups
│   ├── standings/        # Páginas de standings
│   └── globals.css       # Estilos globais
├── lib/                   # Utilitários e helpers
│   ├── matchups.ts       # Lógica de pareamento
│   ├── sleeper.ts        # Cliente da API Sleeper
│   └── sort.ts           # Funções de ordenação
├── public/               # Arquivos estáticos
│   ├── icons/           # Ícones do PWA
│   └── manifest.json    # Manifesto do PWA
└── docs/                # Documentação
```

## 🎯 Como Usar

### Standings

Acesse `/standings/[leagueId]` para visualizar as classificações de uma liga específica.

### Matchups

Acesse `/matchups/[leagueId]` para ver os pareamentos da semana atual, com algoritmos específicos para:

- **Ligas Redraft**: Pareamento Top X vs Top X baseado na semana
- **Ligas Dynasty**: Sistema de pareamento balanceado

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Iniciar servidor de produção
pnpm start

# Linting
pnpm lint

# Verificação de tipos
pnpm type-check
```

## 🐛 Solução de Problemas

### Problemas de Build

Se encontrar problemas de build, consulte o arquivo `CORREÇÕES_BUILD_VERCEL.md` para soluções detalhadas.

### Cache da API

O sistema de cache pode ser desabilitado definindo `ENABLE_CACHE=false` nas variáveis de ambiente.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [Sleeper](https://sleeper.app/) pela API fantástica
- [Next.js](https://nextjs.org/) pelo framework incrível
- [Tailwind CSS](https://tailwindcss.com/) pelo sistema de design

---

**Desenvolvido com ❤️ para a comunidade de fantasy football**