'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { HistoryData } from '../../types';
import { games, keyOf, winPct } from '@/lib/allTime';
import { buildTeamProfile, ProfileSeason } from '@/lib/teamProfile';

type WL = { wins: number; losses: number; ties?: number };
const record = (r: WL) => `${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ''}`;
const pct = (r: { wins: number; losses: number; ties: number }) => (games(r) ? `${(winPct(r) * 100).toFixed(1)}%` : '—');
const pts = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Card = ({ label, children, sub }: { label: string; children: ReactNode; sub?: string }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
    <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">{label}</div>
    <div className="text-2xl font-bold text-slate-100">{children}</div>
    {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
  </div>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
    {children}
  </section>
);

const Table = ({ head, children }: { head: string[]; children: ReactNode }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
        <tr>{head.map((h, i) => <th key={h} className={`px-4 py-3 ${i ? 'text-center' : ''}`}>{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-800/50 text-slate-300 font-mono [&>tr>td:not(:first-child)]:text-center">{children}</tbody>
    </table>
  </div>
);

const SeasonCard = ({ label, s }: { label: string; s: ProfileSeason | null }) => (
  <Card label={label} sub={s ? `${s.year} · ${pct(s)} · ${pts(s.pointsFor)} PF` : undefined}>
    {s ? record(s) : '—'}
  </Card>
);

const playoffLabel = (s: ProfileSeason) => {
  if (!s.playoff) return '—';
  const tag = s.result === 'champion' ? 'Campeão' : s.result === 'runnerUp' ? 'Vice' : 'Playoffs';
  return `${tag} · ${record(s.playoff)}`;
};

export default function ManagerPage() {
  const params = useParams();
  const leagueType = params.leagueType as string;
  const key = keyOf(decodeURIComponent(params.manager as string));

  const [data, setData] = useState<HistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!['redraft', 'dynasty'].includes(leagueType)) { setError('Tipo de liga inválido'); return; }
    fetch(`/api/history?leagueType=${leagueType}`)
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Erro ao carregar histórico');
        setData(await res.json());
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Erro desconhecido'));
  }, [leagueType]);

  const profile = useMemo(() => (data ? buildTeamProfile(data, key) : null), [data, key]);
  const back = `/history/${leagueType}`;

  if (!data && !error) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-slate-800 w-1/3 mb-4 rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 bg-slate-800 rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-red-500/10 text-red-400 p-6 rounded-lg border border-red-500/20 max-w-lg mx-auto">
          <h2 className="text-xl font-bold mb-2">Erro</h2>
          <p>{error || 'Manager não encontrado'}</p>
          <Link href={back} className="mt-4 inline-block text-sm bg-red-500/20 px-4 py-2 rounded hover:bg-red-500/30 transition-colors">
            Voltar ao histórico
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href={back} className="text-xs font-medium text-slate-500 hover:text-slate-300 uppercase tracking-widest mb-2 inline-block">
          ← Voltar
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{profile.displayName}</h1>
          <span className="text-emerald-500 font-bold">{pct(profile)} win rate</span>
          <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
            <TrophyIcon className="w-4 h-4" />{profile.titles} {profile.titles === 1 ? 'título' : 'títulos'}
          </span>
        </div>
        <p className="text-slate-500 text-xs mb-8">
          Estatísticas do Sleeper (2022+), incluindo a temporada em andamento. Títulos incluem 2014 e 2015.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card label="Recorde total">{record(profile)}</Card>
          <Card label="Win rate">{pct(profile)}</Card>
          <Card label="Títulos">{profile.titles}</Card>
          <Card label="Temporadas">{profile.seasons.length}</Card>
          <Card label="Pontos feitos (total)">{profile.pfRank} de {profile.pfTotal}</Card>
          <Card label="Playoff record" sub={`${profile.playoffAppearances}x playoffs`}>
            {profile.playoffAppearances ? `${profile.playoffWins}-${profile.playoffLosses}` : '—'}
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <SeasonCard label="Melhor temporada" s={profile.best} />
          <SeasonCard label="Pior temporada" s={profile.worst} />
        </div>

        <Section title="Temporada por Temporada">
          <Table head={['Ano', 'Recorde', 'Win%', 'PF', 'Colocação', 'Playoffs']}>
            {profile.seasons.map(s => (
              <tr key={s.year} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-sans text-slate-200 font-medium">
                  {s.year}
                  {s.current && <span className="ml-2 text-[10px] uppercase bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded">Em andamento</span>}
                </td>
                <td className="px-4 py-3">{record(s)}</td>
                <td className="px-4 py-3 text-emerald-500 font-bold">{pct(s)}</td>
                <td className="px-4 py-3">{pts(s.pointsFor)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    {s.rank}º{s.result === 'champion' && <TrophyIcon className="w-4 h-4 text-amber-500" />}
                  </span>
                </td>
                <td className="px-4 py-3">{playoffLabel(s)}</td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="H2H contra todos">
          <Table head={['Oponente', 'Recorde', 'Win%', 'Pts (time)', 'Pts (oponente)']}>
            {profile.h2h.map(o => (
              <tr key={o.key} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-sans font-medium">
                  {o.linked
                    ? <Link href={`/history/${leagueType}/${encodeURIComponent(o.key)}`} className="text-slate-200 hover:text-white hover:underline">{o.displayName}</Link>
                    : <span className="text-slate-200">{o.displayName}</span>}
                </td>
                <td className="px-4 py-3">{record(o)}</td>
                <td className="px-4 py-3 text-emerald-500 font-bold">{pct(o)}</td>
                <td className="px-4 py-3">{pts(o.pointsFor)}</td>
                <td className="px-4 py-3">{pts(o.pointsAgainst)}</td>
              </tr>
            ))}
          </Table>
          <p className="mt-2 text-xs text-slate-500">Temporada regular e playoffs no caminho até a final (sem jogos de colocação).</p>
        </Section>
      </div>
    </div>
  );
}
