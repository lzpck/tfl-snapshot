import Link from 'next/link';

import { getLeagueConfig } from '../lib/env-validation';
import { ChevronRightIcon, TrophyIcon, ChartBarIcon, UserGroupIcon, ListBulletIcon } from '@heroicons/react/24/outline';

export default function Home() {
  // Obter configurações validadas das ligas
  const leagueConfig = getLeagueConfig();
  
  const leagues = [
    {
      id: leagueConfig.redraft,
      name: 'TFL: Classic',
      type: 'redraft' as const,
      description: 'Liga de renovação anual com draft completo a cada temporada',
      color: 'blue'
    },
    {
      id: leagueConfig.dynasty,
      name: 'TFL: Dynasty', 
      type: 'dynasty' as const,
      description: 'Liga permanente com times mantidos entre temporadas',
      color: 'green'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-16 space-y-4 flex flex-col items-center">
        <div className="relative w-64 h-64 md:w-80 md:h-80 -mb-20">
          <img
             src="/tfl-logo.png"
             alt="TFL Logo"
             width={500}
             height={500}
             className="object-contain"
           />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-text">
          TFL <span className="text-accent">Snapshot</span>
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto">
          Hub central de estatísticas, história e análise da Timeline Fantasy League.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto px-4">
        {leagues.map((league) => (
          <div 
            key={league.id} 
            className="group relative bg-surface border border-border rounded-2xl p-8 hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/5"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               {league.type === 'redraft' ? (
                 <ChartBarIcon className="w-24 h-24 text-accent" />
               ) : (
                 <UserGroupIcon className="w-24 h-24 text-emerald-500" />
               )}
            </div>

            <h2 className="text-3xl font-bold text-text mb-3 relative z-10">
              {league.name}
            </h2>
            <p className="text-text-muted mb-8 relative z-10 text-lg leading-relaxed">
              {league.description}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              <Link 
                href={`/standings/${league.id}`}
                className="flex items-center justify-between px-5 py-4 bg-surface-hover hover:bg-accent hover:text-white rounded-xl border border-border hover:border-accent transition-all duration-200 group/btn"
              >
                <span className="font-semibold">Classificação</span>
                <ChartBarIcon className="w-5 h-5 text-text-muted group-hover/btn:text-white transition-colors" />
              </Link>
              
              <Link 
                href={`/matchups/${league.id}`}
                className="flex items-center justify-between px-5 py-4 bg-surface-hover hover:bg-accent hover:text-white rounded-xl border border-border hover:border-accent transition-all duration-200 group/btn"
              >
                <span className="font-semibold">Confrontos</span>
                <UserGroupIcon className="w-5 h-5 text-text-muted group-hover/btn:text-white transition-colors" />
              </Link>
              
              <Link 
                href={`/history/${league.type}`}
                className="col-span-1 sm:col-span-2 flex items-center justify-between px-5 py-4 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 rounded-xl border border-amber-500/20 hover:border-amber-500 transition-all duration-200 group/btn mt-2"
              >
                <span className="font-bold flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5" />
                  Hall da Fama & Histórico
                </span>
                <ChevronRightIcon className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>

              {league.type === 'dynasty' && (
                <Link 
                  href={`/draft/${league.id}`}
                  className="col-span-1 sm:col-span-2 flex items-center justify-between px-5 py-4 bg-surface-hover hover:bg-surface text-text-muted hover:text-text rounded-xl border border-border transition-all duration-200 text-sm"
                >
                  <span className="font-medium flex items-center gap-2">
                    <ListBulletIcon className="w-4 h-4" />
                    Ver Draft Order {new Date().getFullYear()}
                  </span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}