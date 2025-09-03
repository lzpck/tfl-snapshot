import Link from 'next/link';

export default function HomePage() {
  const leagues = [
    {
      id: process.env.LEAGUE_ID_REDRAFT || '1180180342143975424',
      name: 'Redraft League',
      description: '14 times • Liga tradicional',
      gradient: 'from-accent to-accent-hover'
    },
    {
      id: process.env.LEAGUE_ID_DYNASTY || '1180180565689552896',
      name: 'Dynasty League',
      description: '10 times • Liga dynasty',
      gradient: 'from-green-500 to-green-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text mb-2">
          Ligas TFL
        </h2>
        <p className="text-text-muted">
          Selecione uma liga para ver os standings atuais
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {leagues.map((league) => (
          <div
            key={league.id}
            className={`bg-gradient-to-br ${league.gradient} text-white rounded-lg p-6 border border-border-muted hover:scale-105 transition-all duration-200 shadow-lg`}
          >
            <h3 className="text-xl font-bold mb-2">
              {league.name}
            </h3>
            <p className="text-white/90 mb-4">
              {league.description}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/standings/${league.id}`}
                className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors backdrop-blur-sm"
              >
                Standings
              </Link>
              <Link
                href={`/matchups/${league.id}`}
                className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors backdrop-blur-sm"
              >
                Matchups
              </Link>
              <Link
                href={`/history/${league.id === (process.env.LEAGUE_ID_REDRAFT || '1180180342143975424') ? 'redraft' : 'dynasty'}`}
                className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors backdrop-blur-sm"
              >
                Histórico
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}