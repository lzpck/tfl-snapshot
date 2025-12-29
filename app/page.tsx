import Link from 'next/link';
import { getLeagueConfig } from '../lib/env-validation';

export default function Home() {
  // Obter configurações validadas das ligas
  const leagueConfig = getLeagueConfig();
  
  const leagues = [
    {
      id: leagueConfig.redraft,
      name: 'Redraft League',
      type: 'redraft' as const,
      description: 'Liga de renovação anual com draft completo a cada temporada'
    },
    {
      id: leagueConfig.dynasty,
      name: 'Dynasty League', 
      type: 'dynasty' as const,
      description: 'Liga permanente com times mantidos entre temporadas'
    }
  ];

  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        TFL Snapshot
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12">
        Acompanhe os standings e matchups da Timeline Fantasy League
      </p>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {leagues.map((league) => (
          <div key={league.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {league.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {league.description}
            </p>
            
            <div className="space-y-4">
              <Link 
                href={`/standings/${league.id}`}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                Ver Standings
              </Link>
              
              <Link 
                href={`/matchups/${league.id}`}
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                Ver Matchups
              </Link>
              
              <Link 
                href={`/history/${league.type}`}
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                Ver Histórico
              </Link>

              {league.type === 'dynasty' && (
                <Link 
                  href={`/draft/${league.id}`}
                  className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
                >
                  Ver Draft Order
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}