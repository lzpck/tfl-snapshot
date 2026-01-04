export interface Champion {
  rosterId: number;
  displayName: string;
  avatar?: string; // Adicionando avatar
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  seed?: number; // Classificação nos playoffs (rank)
}

export interface Standing {
  rank: number;
  rosterId?: number; // Added to allow matching
  displayName: string;
  avatar?: string;
  ownerId?: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface SeasonData {
  year: string;
  leagueId: string;
  champion: Champion | null;
  runnerUp: Champion | null; // Adicionando RunnerUp
  standings: Standing[];
  bracket?: {
    finalRound: number;
    // Poderíamos ter mais detalhes da match final aqui
  };
  note?: string;
}

export interface MatchUser {
  userId: string;
  displayName: string;
  avatar?: string;
  score: number;
}

export interface HistoricalMatch {
  season: string;
  week: number;
  userA: MatchUser;
  userB: MatchUser;
  winnerUserId: string | null; // null em caso de empate
}

export interface HistoryData {
  leagueType: string;
  seasons: SeasonData[];
  matches: HistoricalMatch[];
}
