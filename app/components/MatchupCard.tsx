import TeamCol from './TeamCol';

// Importar tipos necessários
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
}

interface Pair {
  home: Team;
  away: Team;
}

interface MatchupCardProps {
  pair: Pair;
  index: number;
  showStats?: boolean;
}

export default function MatchupCard({ pair, index, showStats = true }: MatchupCardProps) {
  return (
    <div className="bg-surface rounded-lg border border-border-muted p-4 hover:bg-surface-hover focus-within:ring-2 focus-within:ring-accent/50 transition-all duration-200 flex flex-col h-full">
      {/* Cabeçalho do confronto */}
      <div className="text-center mb-4">
        <span className="text-sm font-medium text-text-muted uppercase tracking-wide">
          Confronto {index + 1}
        </span>
      </div>
      
      {/* Grid de 3 colunas: Time A | VS | Time B */}
      <div className="grid grid-cols-3 gap-4 items-center flex-1">
        {/* Time da casa (home) */}
        <div className="flex justify-center">
          <TeamCol team={pair.home} showStats={showStats} />
        </div>
        
        {/* Separador VS centralizado */}
        <div className="flex items-center justify-center">
          <div className="bg-surface-hover rounded-full w-12 h-12 flex items-center justify-center border border-border shadow-sm">
            <span className="text-sm font-bold text-text-muted">VS</span>
          </div>
        </div>
        
        {/* Time visitante (away) */}
        <div className="flex justify-center">
          <TeamCol team={pair.away} showStats={showStats} />
        </div>
      </div>
      
      {/* Rodapé fixo na base do card */}
      {showStats && (
        <div className="mt-auto pt-4 border-t border-border-muted">
          <div className="flex justify-between text-xs text-text-muted">
            <span>
              Diferença de ranking: {Math.abs(pair.home.rank - pair.away.rank)} posições
            </span>
            <span>
              Total de pontos: {(pair.home.pointsFor + pair.away.pointsFor).toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}