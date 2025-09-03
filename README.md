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

Configure as seguintes variáveis no arquivo `.env.local`:

```env
# IDs das Ligas (obrigatório)
REDRAFT_LEAGUE_ID=seu_id_da_liga_redraft
DYNASTY_LEAGUE_ID=seu_id_da_liga_dynasty

# Configurações de Ambiente
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# Configurações de Fuso Horário
TZ=America/New_York

# Configurações de Cache (opcional)
CACHE_TTL=300
ENABLE_CACHE=true
```

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