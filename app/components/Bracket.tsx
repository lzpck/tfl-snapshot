import { BracketRound, BracketMatch } from '@/lib/matchups';
import Image from 'next/image';

interface BracketProps {
  bracket: BracketRound[];
}

export default function Bracket({ bracket }: BracketProps) {
  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex min-w-max gap-8 px-4">
        {bracket.map((round, roundIndex) => (
          <div key={round.round} className="flex flex-col">
            <div className="mb-4 text-center">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                {round.round === bracket.length ? 'Finals' : `Round ${round.round}`}
              </h3>
              <p className="text-xs text-text-muted">Week {round.week}</p>
            </div>
            
            <div className="flex flex-col justify-around flex-grow gap-4">
              {round.matches.map((match, matchIndex) => (
                <div key={match.id} className="relative flex items-center pr-8">
                    <BracketMatchCard match={match} />
                    
                    {/* Connectors */}
                    {round.round < bracket.length && (
                        <BracketConnector 
                            roundIndex={roundIndex} 
                            matchIndex={matchIndex} 
                            totalMatches={round.matches.length}
                        />
                    )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const getTeamDisplay = (team: typeof match.home) => {
    // Determine winner style
    const isWinner = match.winner_id === team.rosterId;
    const isLoser = match.winner_id && match.winner_id !== team.rosterId;
    const isTBD = team.rosterId === 0;

    return (
      <div className={`flex items-center justify-between p-2 ${isWinner ? 'bg-accent/10' : ''} ${isLoser ? 'opacity-80' : ''}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          {team.avatarUrl ? (
             <div className="relative h-6 w-6 rounded-full overflow-hidden flex-shrink-0 bg-surface-hover">
                <Image src={team.avatarUrl} alt={team.displayName} fill className="object-cover" />
             </div>
          ) : (
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${isTBD ? 'bg-gray-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
              {isTBD ? '?' : team.displayName.substring(0, 1)}
            </div>
          )}
          
          <div className="flex flex-col min-w-0">
             <span className="text-xs font-medium text-text truncate max-w-[100px] leading-tight">
                {team.displayName}
             </span>
             {team.rank > 0 && team.rank < 99 && (
                 <span className="text-[10px] text-text-muted">#{team.rank}</span>
             )}
          </div>
        </div>
        
        <div className="flex flex-col items-end ml-2">
           <span className={`text-xs font-bold ${isWinner ? 'text-accent' : 'text-text'}`}>
             {team.pointsFor.toFixed(2)}
           </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1">
        {match.title && (
            <div className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 text-center ${
                match.title.includes('Final') ? 'text-amber-400' : 
                match.title.includes('3rd') ? 'text-orange-400' :
                'text-text-muted'
            }`}>
                {match.title}
            </div>
        )}
        <div className={`w-64 bg-surface rounded-md border shadow-sm overflow-hidden flex flex-col z-10 ${
            match.title?.includes('Final') ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-border'
        }`}>
           {getTeamDisplay(match.home)}
           <div className="h-px bg-border w-full"></div>
           {getTeamDisplay(match.away)}
        </div>
    </div>
  );
}

// Simple logic to draw connecting lines via CSS
// This works best if matches are ordered specifically (1vs8, 4vs5, etc) which they usually are in bracket views
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BracketConnector(_props: { matchIndex: number, totalMatches: number, roundIndex: number }) {
    // If it's an even match (0, 2, 4...), it connects DOWN to the next one
    // If it's an odd match (1, 3, 5...), it connects UP to the previous one
    // This assumes a standard 2-team per match binary tree structure.
    
    // Actually, simple horizontal line out is always needed
    // The vertical connection depends on position.
    
    // In CSS Flex 'justify-around', spacing is dynamic.
    // Drawing lines with absolute positioning relative to the card is tricky without known heights.
    // But for a visual approximation:
    
    return (
        <div className="absolute right-0 top-1/2 w-8 h-px bg-border -mt-px pointer-events-none hidden md:block" />
    );
}
