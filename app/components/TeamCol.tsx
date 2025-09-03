interface Team {
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

interface TeamColProps {
  team: Team;
  showStats?: boolean;
}

export default function TeamCol({ team, showStats = true }: TeamColProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-3">
      {/* Badge do Rank */}
      <div className="flex items-center justify-center">
        <span className="bg-accent/20 text-accent font-bold rounded-full border border-accent/30 text-sm px-2 py-1 min-w-[2.5rem] flex items-center justify-center">
          #{team.rank}
        </span>
      </div>
      
      {/* Nome do Time com truncamento */}
      <div className="w-full">
        <h3 className="font-semibold text-text text-sm leading-tight truncate px-1" title={team.displayName}>
          {team.displayName}
        </h3>
      </div>
      
      {/* Estatísticas do Time */}
      {showStats && (
        <div className="text-xs text-text-muted space-y-1">
          <div className="font-medium">
            {team.wins}W-{team.losses}L
          </div>
          <div>
            {team.pointsFor.toFixed(1)} pts
          </div>
        </div>
      )}
      
      {/* Streak do Time */}
      <div className="flex justify-center">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          team.streak.startsWith('W') 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : team.streak.startsWith('L')
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-surface-hover text-text-muted border border-border'
        }`}>
          {team.streak}
        </span>
      </div>
    </div>
  );
}