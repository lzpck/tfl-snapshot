'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HistoryData } from '../types';
import { ChampionsList } from '../components/ChampionsList';
import { AnnualStandings } from '../components/AnnualStandings';
import { HeadToHead } from '../components/HeadToHead';

export default function HistoryPage() {
  const params = useParams();
  const leagueType = params.leagueType as string;
  
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'champions' | 'standings' | 'matchups'>('champions');

  // Validar leagueType
  const isValidLeagueType = ['redraft', 'dynasty'].includes(leagueType);

  useEffect(() => {
    if (!isValidLeagueType) {
      setError('Tipo de liga inválido');
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/history?leagueType=${leagueType}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar histórico');
        }
        
        const data: HistoryData = await response.json();
        setHistoryData(data);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [leagueType, isValidLeagueType]);

  // Loading State with Skeleton-like feel
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-slate-800 w-1/3 mb-4 rounded"></div>
        <div className="h-4 bg-slate-800 w-1/4 mb-8 rounded"></div>
        <div className="space-y-4">
           {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-800 rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  if (error || !isValidLeagueType) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
         <div className="bg-red-500/10 text-red-400 p-6 rounded-lg border border-red-500/20 max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-2">Erro</h2>
            <p>{error || 'Liga inválida'}</p>
            <Link href="/" className="mt-4 inline-block text-sm bg-red-500/20 px-4 py-2 rounded hover:bg-red-500/30 transition-colors">
              Voltar para Home
            </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
       <div className="container mx-auto px-4 py-8 max-w-5xl">
          
          {/* Header */}
          <div className="mb-8">
             <Link href="/" className="text-xs font-medium text-slate-500 hover:text-slate-300 uppercase tracking-widest mb-2 inline-block">
               ← Voltar
             </Link>
             <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
               Histórico: {leagueType === 'dynasty' ? 'TFL: Dynasty' : 'TFL: Classic'}
             </h1>
             <p className="text-slate-400 text-sm">
               Hall da Fama, classificações anuais e matriz de rivalidades.
             </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 mb-8 bg-slate-900/50 p-1 rounded-lg border border-slate-800 w-fit">
             <button
               onClick={() => setActiveTab('champions')}
               className={`
                 px-6 py-2 rounded-md text-sm font-medium transition-all duration-200
                 ${activeTab === 'champions' 
                   ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' 
                   : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
               `}
             >
               Campeões
             </button>
             <button
               onClick={() => setActiveTab('standings')}
               className={`
                 px-6 py-2 rounded-md text-sm font-medium transition-all duration-200
                 ${activeTab === 'standings' 
                   ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' 
                   : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
               `}
             >
               Classificação
             </button>
             <button
               onClick={() => setActiveTab('matchups')}
               className={`
                 px-6 py-2 rounded-md text-sm font-medium transition-all duration-200
                 ${activeTab === 'matchups' 
                   ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' 
                   : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
               `}
             >
               Confrontos
             </button>
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in zoom-in-95 duration-300">
             {activeTab === 'champions' && historyData && (
                <ChampionsList seasons={historyData.seasons} />
             )}

             {activeTab === 'standings' && historyData && (
                <AnnualStandings seasons={historyData.seasons} />
             )}

             {activeTab === 'matchups' && historyData && (
                <HeadToHead matches={historyData.matches || []} />
             )}
          </div>

       </div>
    </div>
  );
}