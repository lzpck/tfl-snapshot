// SleeperDraft removido dos imports pois não é usado explicitamente aqui (inferido)
import { fetchDrafts, fetchTradedPicks, fetchLeagueData, mapSleeperDataToTeams, fetchWinnersBracket } from '@/lib/sleeper';
import { DraftOrderList } from '@/components/DraftOrderList';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1 min revalidation

export default async function DraftPage(props: { params: Promise<{ leagueId: string }> }) {
  const params = await props.params;
  const { leagueId } = params;
  
  // Parallel fetch for efficiency
  const [{ league, users, rosters }, drafts, winnersBracket] = await Promise.all([
    fetchLeagueData(leagueId),
    fetchDrafts(leagueId),
    fetchWinnersBracket(leagueId)
  ]);

  // Adicionar rank: 0 para satisfazer a interface Team
  const teams = mapSleeperDataToTeams(users, rosters).map(t => ({ ...t, rank: 0 }));

  if (!league) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Liga não encontrada</h1>
        <Link href="/" className="text-blue-500 hover:underline">Voltar para Home</Link>
      </div>
    );
  }

  // Determine relevant draft
  let relevantDraft = drafts
    .sort((a, b) => {
        // Priority map
        const statusPriority: Record<string, number> = { drafting: 3, paused: 3, pre_draft: 2, complete: 1 };
        const pA = statusPriority[a.status] || 0;
        const pB = statusPriority[b.status] || 0;
        if (pA !== pB) return pB - pA; // Higher priority first
        
        // If same status, desc by season?
        // usually later season is better
        if (a.season !== b.season) return b.season.localeCompare(a.season);

        return (b.start_time || 0) - (a.start_time || 0); 
    })[0];
    
  // FALLBACK: Se não existir draft futuro (ex: Sleeper ainda não virou o ano), 
  // cria um objeto "Virtual Draft" para a próxima temporada.
  if (!relevantDraft || relevantDraft.status === 'complete') {
     const nextSeason = (parseInt(league.season) + 1).toString();
     relevantDraft = {
       draft_id: 'virtual-draft',
       league_id: leagueId,
       season: nextSeason,
       status: 'pre_draft',
       type: 'linear',
       settings: {
         rounds: 3,
         slots_bn: 0,
         slots_flex: 0,
         teams: teams.length
       },
       draft_order: null,
       slot_to_roster_id: null,
       season_type: 'regular',
       start_time: 0,
       last_picked: 0
     };
  }

  // Se for um draft real, busca traded picks. Se for virtual, não tem (ou teria que buscar traded picks da liga em geral, mas Sleeper anexa trades ao draft_id).
  // Infelizmente sem um draft_id real, traded_picks da API de draft não funcionam.
  // Porem, podemos tentar buscar picks trocadas via API de transações se fosse necessário, mas é complexo.
  // Vamos assumir array vazio para draft virtual por enquanto, ou tentar usar o ID do draft anterior se as trades rolaram lá (arriscado).
  // Nota: Sleeper migra traded picks para o novo draft quando ele é criado. Antes disso, elas "existem" no limbo da liga.
  const tradedPicks = relevantDraft.draft_id !== 'virtual-draft' 
      ? await fetchTradedPicks(relevantDraft.draft_id) 
      : [];

  return (
     <div className="container mx-auto px-4 py-8">
       <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mb-1 inline-flex items-center gap-1 font-medium transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Voltar para Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
               {league.name}
            </h1>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full text-blue-700 dark:text-blue-300 text-sm font-semibold border border-blue-100 dark:border-blue-800">
             {relevantDraft.season} Draft Order
          </div>
       </div>

       <DraftOrderList 
         draft={relevantDraft} 
         tradedPicks={tradedPicks} 
         teams={teams}
         winnersBracket={winnersBracket}
       />
     </div>
  );
}
