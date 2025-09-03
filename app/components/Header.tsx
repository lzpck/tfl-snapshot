'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Garante que o componente só renderize a navegação após a hidratação
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determina se estamos em uma página de standings ou matchups
  const isStandings = mounted ? pathname.includes('/standings') : false;
  const isMatchups = mounted ? pathname.includes('/matchups') : false;
  
  // Extrai o leagueId da URL atual se estivermos em uma página específica
  const leagueIdMatch = mounted ? pathname.match(/\/(standings|matchups)\/([^/]+)/) : null;
  const currentLeagueId = leagueIdMatch ? leagueIdMatch[2] : null;

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo/Título */}
          <Link 
            href="/" 
            className="text-lg sm:text-xl font-bold text-text hover:text-accent transition-colors"
          >
            TFL Snapshot
          </Link>
          
          {/* Container para navegação e theme toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Navegação - só renderiza após hidratação */}
            {mounted && currentLeagueId && (
              <nav className="flex gap-1 sm:gap-2">
                <Link
                  href={`/standings/${currentLeagueId}`}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isStandings
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-muted hover:text-text hover:bg-surface-hover'
                  }`}
                >
                  Standings
                </Link>
                <Link
                  href={`/matchups/${currentLeagueId}`}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isMatchups
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-muted hover:text-text hover:bg-surface-hover'
                  }`}
                >
                  Matchups
                </Link>
              </nav>
            )}
            
            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}