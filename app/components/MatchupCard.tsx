// Importar tipos necessários
interface Team {
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
}

interface Pair {
  home: Team;
  away: Team;
  status?: 'scheduled' | 'in_progress' | 'final';
}

interface MatchupCardProps {
  pair: Pair;
  index: number;
  showStats?: boolean;
}

export default function MatchupCard({ pair, index }: MatchupCardProps) {
  // Determinar vencedor
  const homeWin = pair.home.pointsFor > pair.away.pointsFor;
  const awayWin = pair.away.pointsFor > pair.home.pointsFor;
  
  // Se pointsFor for 0 para ambos, provavelmente o jogo não começou ou é projeção futura sem pontos
  // Se 'status' vier da API, usamos ele. Se não, usamos inferência de pontos.
  const status = pair.status || (pair.home.pointsFor > 0 || pair.away.pointsFor > 0 ? 'in_progress' : 'scheduled');
  const hasStarted = status === 'in_progress' || status === 'final';
  
  // Texto do badge
  let statusText = 'Agendado';
  let statusColor = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  
  if (status === 'final') {
    statusText = 'Finalizado';
    statusColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  } else if (status === 'in_progress') {
    statusText = 'Em andamento';
    statusColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
      {/* Header do Card - Identificação do Jogo */}
      <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Matchup {index + 1}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor}`}>
           {statusText}
        </span>
      </div>

      <div className="p-4">
        {/* Usando Grid para garantir distribuição simétrica e evitar que o placar empurre os times incorretamente */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          
          {/* TIME DA CASA (HOME) - Esquerda */}
          <div className={`flex flex-col items-center min-w-0 ${status === 'final' && awayWin ? 'opacity-40' : 'opacity-100'}`}>
            <div className="relative mb-2 shrink-0">
               {pair.home.avatarUrl ? (
                <img 
                  src={pair.home.avatarUrl} 
                  alt={pair.home.displayName} 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
                />
               ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-2 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-300 font-bold text-base sm:text-lg">
                  {pair.home.displayName.charAt(0)}
                </div>
               )}
               <span className="absolute -bottom-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-300">
                 {pair.home.rank}
               </span>
            </div>
            
            <div className="text-center w-full px-0.5 flex flex-col justify-center h-9 sm:h-10">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 break-words" title={pair.home.displayName}>
                {pair.home.displayName}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">
                {pair.home.wins}-{pair.home.losses}
              </p>
            </div>
          </div>

          {/* PLACAR CENTRAL */}
          <div className="flex flex-col items-center px-1 sm:px-2 shrink-0">
            {hasStarted ? (
              <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
                <span className={`text-lg sm:text-xl font-bold tracking-tight ${status === 'final' && homeWin ? 'text-gray-900 dark:text-white' : status === 'final' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                  {pair.home.pointsFor.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 font-medium my-0.5 sm:my-0">VS</span>
                <span className={`text-lg sm:text-xl font-bold tracking-tight ${status === 'final' && awayWin ? 'text-gray-900 dark:text-white' : status === 'final' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                  {pair.away.pointsFor.toFixed(2)}
                </span>
              </div>
            ) : (
               <div className="flex flex-col items-center">
                 <span className="text-sm font-bold text-gray-300 dark:text-gray-600">VS</span>
                 <span className="text-[10px] text-gray-400">0.00 - 0.00</span>
               </div>
            )}
          </div>

          {/* TIME VISITANTE (AWAY) - Direita */}
          <div className={`flex flex-col items-center min-w-0 ${status === 'final' && homeWin ? 'opacity-40' : 'opacity-100'}`}>
            <div className="relative mb-2 shrink-0">
               {pair.away.avatarUrl ? (
                <img 
                  src={pair.away.avatarUrl} 
                  alt={pair.away.displayName} 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
                />
               ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center border-2 border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 font-bold text-base sm:text-lg">
                  {pair.away.displayName.charAt(0)}
                </div>
               )}
               <span className="absolute -bottom-1 -left-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-300">
                 {pair.away.rank}
               </span>
            </div>
            
            <div className="text-center w-full px-0.5 flex flex-col justify-center h-9 sm:h-10">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 break-words" title={pair.away.displayName}>
                {pair.away.displayName}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">
                {pair.away.wins}-{pair.away.losses}
              </p>
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer com indicação de vitória */}
      {status === 'final' && (homeWin || awayWin) && (
        <div className={`h-1 w-full ${homeWin ? 'bg-gradient-to-r from-blue-500 to-transparent' : 'bg-gradient-to-l from-red-500 to-transparent'}`}>
        </div>
      )}
      {status === 'in_progress' && (
        <div className="h-1 w-full bg-yellow-400/50 animate-pulse"></div>
      )}
    </div>
  );
}