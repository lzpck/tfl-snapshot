'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { HistoricalMatch, MatchUser } from '../types';

interface HeadToHeadProps {
  matches: HistoricalMatch[];
}

export function HeadToHead({ matches }: HeadToHeadProps) {
  const [userAId, setUserAId] = useState<string>('');
  const [userBId, setUserBId] = useState<string>('');

  // Extrair usuários únicos de todas as partidas
  const users = useMemo(() => {
    const userMap = new Map<string, MatchUser>();
    
    matches.forEach(match => {
      // Priorizar avatares e nomes mais recentes se possível
      // Mas por simplificação, pegamos o primeiro que aparecer ou sobrescrevemos
      if (!userMap.has(match.userA.userId)) {
        userMap.set(match.userA.userId, match.userA);
      } else if (match.userA.avatar && !userMap.get(match.userA.userId)?.avatar) {
          // Atualizar se tiver avatar e o anterior não
          userMap.set(match.userA.userId, match.userA);
      }
      
      if (!userMap.has(match.userB.userId)) {
        userMap.set(match.userB.userId, match.userB);
      } else if (match.userB.avatar && !userMap.get(match.userB.userId)?.avatar) {
          userMap.set(match.userB.userId, match.userB);
      }
    });
    
    return Array.from(userMap.values()).sort((a, b) => 
      a.displayName.localeCompare(b.displayName)
    );
  }, [matches]);

  // Set initial state if users exist and not selected
  useMemo(() => {
    if (users.length >= 2 && !userAId && !userBId) {
       // Opcional: pré-selecionar os 2 primeiros
       // setUserAId(users[0].userId);
       // setUserBId(users[1].userId);
    }
  }, [users, userAId, userBId]);

  const h2hStats = useMemo(() => {
    if (!userAId || !userBId) return null;

    const relevantMatches = matches.filter(m => 
      (m.userA.userId === userAId && m.userB.userId === userBId) ||
      (m.userA.userId === userBId && m.userB.userId === userAId)
    );

    const stats = {
      winsA: 0,
      winsB: 0,
      pointsA: 0,
      pointsB: 0,
      matches: [] as HistoricalMatch[],
    };

    // Ordenar partidas cronologicamente inversa (mais recente primeiro)
    const sortedMatches = [...relevantMatches].sort((a, b) => {
      if (a.season !== b.season) return parseInt(b.season) - parseInt(a.season);
      return b.week - a.week;
    });

    sortedMatches.forEach(match => {
      const isAHome = match.userA.userId === userAId;
      const scoreA = isAHome ? match.userA.score : match.userB.score;
      const scoreB = isAHome ? match.userB.score : match.userA.score;

      stats.pointsA += scoreA;
      stats.pointsB += scoreB;

      if (scoreA > scoreB) stats.winsA++;
      else if (scoreB > scoreA) stats.winsB++;
      // Empates ignorados na contagem de vitórias, mas incluídos no histórico
    });

    stats.matches = sortedMatches;
    return stats;
  }, [matches, userAId, userBId]);

  const selectedUserA = users.find(u => u.userId === userAId);
  const selectedUserB = users.find(u => u.userId === userBId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Selectors Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          
          {/* User A Selector */}
          <div className="w-full md:w-1/2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Time A (Casa)
            </label>
            <div className="relative">
              <select
                value={userAId}
                onChange={(e) => setUserAId(e.target.value)}
                className="w-full appearance-none bg-slate-800 border border-slate-700 text-white rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Selecione um time...</option>
                {users.map(user => (
                  <option key={user.userId} value={user.userId}>
                    {user.displayName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* VS Icon */}
          <div className="flex-shrink-0 bg-slate-800 p-3 rounded-full border border-slate-700 shadow-lg z-10 -my-3 md:my-0">
             {/* Using a Swords icon or similar */}
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-slate-400">
                <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                <path d="m13 19 6-6" />
                <path d="M16 16 4 4" />
                <path d="M21 21l-5.5-5.5" />
                <path d="m21 3-9 9" />
                <path d="M3 21v-3l9-9" />
             </svg>
          </div>

          {/* User B Selector */}
          <div className="w-full md:w-1/2">
             <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-right md:text-left">
              Time B (Visitante)
            </label>
             <div className="relative">
              <select
                value={userBId}
                onChange={(e) => setUserBId(e.target.value)}
                className="w-full appearance-none bg-slate-800 border border-slate-700 text-white rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">Selecione um time...</option>
                {users.map(user => (
                  <option key={user.userId} value={user.userId}>
                    {user.displayName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {h2hStats && selectedUserA && selectedUserB ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          
          {/* Main Visual Comparison */}
          <div className="p-8 md:p-12 relative overflow-hidden">
            {/* Background Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-red-900/10 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">
              
              {/* Team A */}
              <div className="flex flex-col items-center text-center w-full md:w-1/3">
                <div className="relative mb-4 group">
                  <div className={`absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500 ${h2hStats.winsA > h2hStats.winsB ? 'opacity-50' : ''}`}></div>
                  <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-slate-800 overflow-hidden bg-slate-800 shadow-xl">
                     {selectedUserA.avatar ? (
                        <Image 
                          src={selectedUserA.avatar} 
                          alt={selectedUserA.displayName}
                          fill
                          className="object-cover"
                        />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-700 text-3xl font-bold text-slate-500">
                           {selectedUserA.displayName.charAt(0)}
                        </div>
                     )}
                  </div>
                  {h2hStats.winsA > h2hStats.winsB && (
                     <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-amber-300 transform rotate-12">
                        VENCEU
                     </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{selectedUserA.displayName}</h3>
                <div className="flex items-baseline gap-1">
                   <span className="text-4xl md:text-5xl font-black text-blue-500">{h2hStats.winsA}</span>
                   <span className="text-xs font-bold text-blue-500/70 uppercase tracking-widest">Vitórias</span>
                </div>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center w-full md:w-1/5 my-4 md:my-0">
                 <div className="text-6xl font-black text-slate-800 select-none opacity-50">VS</div>
                 <div className="text-xs font-medium text-slate-500 bg-slate-800 px-3 py-1 rounded-full mt-2">
                    {h2hStats.matches.length} Jogos
                 </div>
              </div>

              {/* Team B */}
              <div className="flex flex-col items-center text-center w-full md:w-1/3 text-white">
                 <div className="relative mb-4 group">
                  <div className={`absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500 ${h2hStats.winsB > h2hStats.winsA ? 'opacity-50' : ''}`}></div>
                  <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-slate-800 overflow-hidden bg-slate-800 shadow-xl">
                     {selectedUserB.avatar ? (
                        <Image 
                          src={selectedUserB.avatar} 
                          alt={selectedUserB.displayName}
                          fill
                          className="object-cover"
                        />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-700 text-3xl font-bold text-slate-500">
                           {selectedUserB.displayName.charAt(0)}
                        </div>
                     )}
                  </div>
                  {h2hStats.winsB > h2hStats.winsA && (
                     <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-amber-300 transform rotate-12">
                        VENCEU
                     </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{selectedUserB.displayName}</h3>
                <div className="flex items-baseline gap-1">
                   <span className="text-4xl md:text-5xl font-black text-red-500">{h2hStats.winsB}</span>
                   <span className="text-xs font-bold text-red-500/70 uppercase tracking-widest">Vitórias</span>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 border-t border-slate-800 bg-slate-900/50 divide-x divide-slate-800">
             <div className="p-6 text-center">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Pontuação Total</div>
                <div className="text-2xl font-bold text-white tracking-tight">{h2hStats.pointsA.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
             </div>
             <div className="p-6 text-center">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Pontuação Total</div>
                <div className="text-2xl font-bold text-white tracking-tight">{h2hStats.pointsB.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
             </div>
          </div>

          {/* Match History */}
          <div className="border-t border-slate-800 bg-slate-900/30">
             <div className="px-6 py-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/20">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Histórico de Partidas</h4>
                <span className="text-xs text-slate-600">Últimos {h2hStats.matches.length} Jogos</span>
             </div>
             
             <div className="divide-y divide-slate-800/50 max-h-96 overflow-y-auto custom-scrollbar">
                {h2hStats.matches.length > 0 ? (
                   h2hStats.matches.map((match) => {
                      const isAHome = match.userA.userId === userAId;
                      // Obter scores corretos baseado na seleção
                      const scoreA = isAHome ? match.userA.score : match.userB.score;
                      const scoreB = isAHome ? match.userB.score : match.userA.score;
                      
                      const isWinA = scoreA > scoreB;
                      const isWinB = scoreB > scoreA;

                      return (
                        <div key={`${match.season}-${match.week}-${match.userA.userId}-${match.userB.userId}`} className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between hover:bg-slate-800/30 transition-colors group">
                           
                           <div className="flex flex-col mb-2 sm:mb-0 w-full sm:w-auto text-center sm:text-left">
                              <span className="text-sm font-bold text-white">{match.season}</span>
                              <span className="text-xs text-slate-500">Semana {match.week}</span>
                           </div>

                           <div className="flex items-center gap-6 w-full sm:w-auto justify-center">
                              <span className={`text-lg font-mono font-medium ${isWinA ? 'text-blue-400' : 'text-slate-500'}`}>
                                 {scoreA.toFixed(2)}
                              </span>
                              <span className="text-slate-700 text-xs">•</span>
                              <span className={`text-lg font-mono font-medium ${isWinB ? 'text-red-400' : 'text-slate-500'}`}>
                                 {scoreB.toFixed(2)}
                              </span>
                           </div>
                           
                           <div className="hidden sm:block w-20 text-right">
                              {/* Espaço para resultado ou algo extra se precisar */}
                              {isWinA ? (
                                <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-1 rounded">Venceu</span>
                              ) : isWinB ? (
                                <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded">Venceu</span>
                              ) : null}
                           </div>
                        </div>
                      );
                   })
                ) : (
                   <div className="p-8 text-center text-slate-500 text-sm">
                      Nenhuma partida encontrada entre esses dois times na temporada regular.
                   </div>
                )}
             </div>
          </div>
          
          <div className="p-4 bg-slate-950/50 text-center border-t border-slate-800">
             <p className="text-[10px] text-slate-500 italic">
               * Estatísticas baseadas exclusivamente em jogos da Temporada Regular. Playoffs e Consolation não são contabilizados.
             </p>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-600">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
               </svg>
           </div>
           <h3 className="text-lg font-bold text-white mb-2">Selecione dois times</h3>
           <p className="text-slate-400 max-w-sm">
             Escolha dois times acima para ver o histórico completo de confrontos e rivalidade.
           </p>
        </div>
      )}
    </div>
  );
}
