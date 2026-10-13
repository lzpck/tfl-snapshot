import type { HistoryData, SeasonData } from '@/app/history/types';
import { keyOf, winPct } from './allTime';

const SLEEPER_FROM = 2022;

export interface ProfileSeason {
  year: string;
  current: boolean;
  wins: number; losses: number; ties: number;
  pointsFor: number;
  rank: number;
  playoff: { wins: number; losses: number } | null; // null = fora da chave do título
  result: 'champion' | 'runnerUp' | null;
}

export interface H2HRow {
  key: string;
  displayName: string;
  linked: boolean; // tem página (linha na All-Time)
  wins: number; losses: number; ties: number;
  pointsFor: number; pointsAgainst: number;
}

export interface TeamProfile {
  displayName: string;
  wins: number; losses: number; ties: number;
  titles: number;
  seasons: ProfileSeason[]; // mais recente primeiro
  pfRank: number; pfTotal: number;
  playoffAppearances: number; playoffWins: number; playoffLosses: number;
  best: ProfileSeason | null; worst: ProfileSeason | null; // sem a temporada atual
  h2h: H2HRow[];
}

const sum = <T>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

export function buildTeamProfile(data: HistoryData, key: string): TeamProfile | null {
  const row = data.allTime.find(r => keyOf(r.displayName) === key);
  if (!row) return null;

  const sleeper: Array<{ s: SeasonData; current: boolean }> = [
    ...(data.currentSeason ? [{ s: data.currentSeason, current: true }] : []),
    ...data.seasons.filter(s => parseInt(s.year) >= SLEEPER_FROM).map(s => ({ s, current: false })),
  ];

  const pfByManager = new Map<string, number>();
  const seasons: ProfileSeason[] = [];
  for (const { s, current } of sleeper) {
    for (const t of s.standings) {
      const k = keyOf(t.displayName);
      pfByManager.set(k, (pfByManager.get(k) ?? 0) + t.pointsFor);
      if (k !== key) continue;
      const po = s.playoffs?.find(p => keyOf(p.displayName) === key);
      const is = (c: SeasonData['champion']) => !!c && keyOf(c.displayName) === key;
      seasons.push({
        year: s.year, current,
        wins: t.wins, losses: t.losses, ties: t.ties, pointsFor: t.pointsFor, rank: t.rank,
        playoff: po ? { wins: po.wins, losses: po.losses } : null,
        result: is(s.champion) ? 'champion' : is(s.runnerUp) ? 'runnerUp' : null,
      });
    }
  }
  seasons.sort((a, b) => parseInt(b.year) - parseInt(a.year));

  const finished = seasons.filter(s => !s.current)
    .sort((a, b) => winPct(b) - winPct(a) || b.pointsFor - a.pointsFor);
  const withPlayoffs = seasons.filter(s => s.playoff);

  const allTimeKeys = new Set(data.allTime.map(r => keyOf(r.displayName)));
  const h2h = new Map<string, H2HRow>();
  for (const m of [...data.matches, ...(data.extraMatches ?? [])]) {
    const [me, opp] = keyOf(m.userA.displayName) === key ? [m.userA, m.userB]
      : keyOf(m.userB.displayName) === key ? [m.userB, m.userA] : [];
    if (!me || !opp) continue;
    const ok = keyOf(opp.displayName);
    const r = h2h.get(ok) ?? {
      key: ok, displayName: data.allTime.find(a => keyOf(a.displayName) === ok)?.displayName ?? opp.displayName,
      linked: allTimeKeys.has(ok), wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0,
    };
    if (m.winnerUserId === null) r.ties++;
    else if (m.winnerUserId === me.userId) r.wins++;
    else r.losses++;
    r.pointsFor += me.score; r.pointsAgainst += opp.score;
    h2h.set(ok, r);
  }

  const myPf = pfByManager.get(key) ?? 0;
  return {
    displayName: row.displayName,
    wins: sum(seasons, s => s.wins), losses: sum(seasons, s => s.losses), ties: sum(seasons, s => s.ties),
    // O All-Time não inclui a temporada atual; se o título dela já foi decidido, soma aqui.
    titles: row.titles + (seasons.some(s => s.current && s.result === 'champion') ? 1 : 0),
    seasons,
    pfRank: 1 + [...pfByManager.values()].filter(pf => pf > myPf).length,
    pfTotal: pfByManager.size,
    playoffAppearances: withPlayoffs.length,
    playoffWins: sum(withPlayoffs, s => s.playoff!.wins),
    playoffLosses: sum(withPlayoffs, s => s.playoff!.losses),
    best: finished[0] ?? null,
    worst: finished.at(-1) ?? null,
    h2h: [...h2h.values()].sort((a, b) => winPct(b) - winPct(a) || (b.wins + b.losses + b.ties) - (a.wins + a.losses + a.ties)),
  };
}
