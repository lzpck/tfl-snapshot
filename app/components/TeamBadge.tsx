interface TeamBadgeProps {
  teamName: string;
  rank?: number;
  wins?: number;
  losses?: number;
  points?: number;
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
}

export default function TeamBadge({ 
  teamName, 
  rank, 
  wins, 
  losses, 
  points, 
  size = 'md',
  showStats = false 
}: TeamBadgeProps) {
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2', 
    lg: 'text-lg px-4 py-3'
  };

  const rankBadgeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-2.5 py-1.5'
  };

  return (
    <div className="flex items-center gap-2">
      {/* Badge do Rank */}
      {rank && (
        <span className={`
          ${rankBadgeClasses[size]} 
          bg-accent/20 text-accent font-bold rounded-full border border-accent/30
          flex items-center justify-center min-w-0
        `}>
          #{rank}
        </span>
      )}
      
      {/* Nome do Time */}
      <div className="flex-1 min-w-0">
        <div className={`
          ${sizeClasses[size]} 
          font-medium text-text truncate
        `}>
          {teamName}
        </div>
        
        {/* Estatísticas opcionais */}
        {showStats && (wins !== undefined || losses !== undefined || points !== undefined) && (
          <div className="text-xs text-text-muted mt-1">
            {wins !== undefined && losses !== undefined && (
              <span className="mr-3">
                {wins}W-{losses}L
              </span>
            )}
            {points !== undefined && (
              <span>
                {points.toFixed(1)} pts
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}