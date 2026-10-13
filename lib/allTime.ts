import type { AllTimeRow, SeasonData } from '@/app/history/types';

// Nome (minúsculo) -> chave do manager. Só dados manuais (2014-2021) têm nomes divergentes;
// quem não está aqui usa o próprio nome como chave.
const ALIASES: Record<string, string> = {
  vaideitarmateus: 'vaideitarmaconha',
  geovanosdays: 'mistereliable',
  'rip geovanosdays': 'mistereliable',
  diasgeovani_: 'mistereliable',
  coverdolegolas: 'homemfutebol',
  coverdolebron: 'homemfutebol',
  coverdofagner: 'homemfutebol',
  kisuke: 'homemfutebol',
  coverdokisuke: 'homemfutebol',
  qkisuke: 'homemfutebol',
  portaljoaom: 'joaomarcoscarmona',
  portaljacom: 'joaomarcoscarmona',
  portaljrmcs: 'joaomarcoscarmona',
  leandroschultz_: 'schultz',
  rookiebugado: 'wonderwalluscas',
  _lcsmagalhaes: 'wonderwalluscas',
  diego_guedes19: 'diegoguedes19',
  nilszn: 'bignilsin',
};

// Linhas manuais que não pertencem a nenhum manager conhecido ("ano:nome").
// 2019: coverdofagner e coverdolebron coexistem, mas são a mesma pessoa; o cadastro de coverdolebron é o suspeito.
const EXCLUDED = new Set(['2019:coverdolebron']);

const keyOf = (name: string) => {
  const k = name.trim().toLowerCase();
  return ALIASES[k] ?? k;
};

export function buildAllTime(seasons: SeasonData[]): AllTimeRow[] {
  const rows = new Map<string, AllTimeRow & { lastYear: number }>();

  const get = (name: string, year: number) => {
    const key = keyOf(name);
    let row = rows.get(key);
    if (!row) {
      row = {
        displayName: name, seasons: 0, statSeasons: 0, wins: 0, losses: 0, ties: 0, pointsFor: 0,
        playoffAppearances: 0, playoffWins: 0, playoffLosses: 0, titles: 0, lastYear: 0,
      };
      rows.set(key, row);
    }
    if (year >= row.lastYear) { row.lastYear = year; row.displayName = name; } // nome mais recente
    return row;
  };

  const seasonsSeen = new Set<string>(); // evita contar a mesma temporada duas vezes por manager
  const countSeason = (key: string, year: string, row: AllTimeRow) => {
    if (!seasonsSeen.has(`${key}:${year}`)) { seasonsSeen.add(`${key}:${year}`); row.seasons++; }
  };

  for (const s of seasons) {
    const year = parseInt(s.year);

    for (const t of s.standings) {
      if (EXCLUDED.has(`${s.year}:${t.displayName.toLowerCase()}`)) continue;
      const row = get(t.displayName, year);
      countSeason(keyOf(t.displayName), s.year, row);
      row.statSeasons++;
      row.wins += t.wins; row.losses += t.losses; row.ties += t.ties; row.pointsFor += t.pointsFor;
    }

    for (const p of s.playoffs ?? []) {
      const row = get(p.displayName, year);
      row.playoffAppearances++; row.playoffWins += p.wins; row.playoffLosses += p.losses;
    }

    if (s.champion) {
      const row = get(s.champion.displayName, year);
      countSeason(keyOf(s.champion.displayName), s.year, row); // cobre 2014/2015, sem standings
      row.titles++;
    }
  }

  return [...rows.values()]
    .map(({ lastYear: _lastYear, ...r }) => r)
    .sort((a, b) => winPct(b) - winPct(a) || b.titles - a.titles || avgPf(b) - avgPf(a));
}

export const games = (r: AllTimeRow) => r.wins + r.losses + r.ties;
export const winPct = (r: AllTimeRow) => (games(r) ? (r.wins + r.ties / 2) / games(r) : 0);
export const avgPf = (r: AllTimeRow) => (r.statSeasons ? r.pointsFor / r.statSeasons : 0);
