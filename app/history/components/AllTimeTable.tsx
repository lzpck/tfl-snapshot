import Link from 'next/link';
import { AllTimeRow } from '../types';
import { avgPf, games, keyOf, winPct } from '@/lib/allTime';
import { TrophyIcon } from '@heroicons/react/24/solid';

export function AllTimeTable({ rows, leagueType }: { rows: AllTimeRow[]; leagueType: string }) {
  if (rows.length === 0) return <div className="p-8 text-center text-slate-500">Nenhum dado disponível</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 text-center w-12">#</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3 text-center">Recorde</th>
              <th className="px-4 py-3 text-center text-emerald-500">Win%</th>
              <th className="px-4 py-3 text-right">Avg PF</th>
              <th className="px-4 py-3 text-center">Playoffs</th>
              <th className="px-4 py-3 text-center">Títulos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.map((r, i) => (
              <tr key={r.displayName} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-4 text-center text-slate-500 font-medium">{i + 1}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <Link href={`/history/${leagueType}/${encodeURIComponent(keyOf(r.displayName))}`} className="text-slate-200 font-medium hover:text-white hover:underline">{r.displayName}</Link>
                    <span className="text-xs text-slate-500">
                      {r.seasons} {r.seasons === 1 ? 'temporada' : 'temporadas'} · {Math.round(r.pointsFor).toLocaleString('pt-BR')} PF total
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center text-slate-300 font-mono">
                  {games(r) ? `${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ''}` : '—'}
                </td>
                <td className="px-4 py-4 text-center font-bold text-emerald-500">
                  {games(r) ? `${(winPct(r) * 100).toFixed(1)}%` : '—'}
                </td>
                <td className="px-4 py-4 text-right text-slate-300 font-mono">
                  {r.statSeasons ? avgPf(r).toFixed(2) : '—'}
                </td>
                <td className="px-4 py-4 text-center text-slate-300 font-mono">
                  {r.playoffAppearances ? `${r.playoffAppearances}x · ${r.playoffWins}-${r.playoffLosses}` : '—'}
                </td>
                <td className="px-4 py-4 text-center">
                  {r.titles ? (
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                      <TrophyIcon className="w-4 h-4" />{r.titles}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-800">
        Recorde, Win% e Avg PF (média de PF por temporada) consideram a temporada regular (2016+).
        Playoffs: apenas dados do Sleeper (2022+), sem jogos de colocação (3º, 5º, 7º lugar...).
        Títulos incluem 2014 e 2015. Dados manuais anteriores a 2022 podem conter imprecisões (ex.: 2019).
      </p>
    </div>
  );
}
