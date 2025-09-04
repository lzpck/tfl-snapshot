'use client';

import { useEffect, useState } from 'react';

/**
 * Componente para exibir o widget de timeline do Twitter
 * Carrega automaticamente o script do Twitter e renderiza a timeline
 * Adapta-se automaticamente ao tema claro/escuro
 */
export default function TwitterWidget() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Detecta o tema atual
    const detectTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
    };

    // Detecta tema inicial
    detectTheme();

    // Observa mudanças no tema
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Verifica se o script do Twitter já foi carregado
    if (typeof window !== 'undefined' && !(window as any).twttr) {
      // Cria e adiciona o script do Twitter
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.head.appendChild(script);
    } else if ((window as any).twttr) {
      // Se o script já foi carregado, recarrega os widgets
      (window as any).twttr.widgets.load();
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-text mb-1">
          Últimas do TFL
        </h3>
        <p className="text-sm text-text-muted">
          Acompanhe as novidades da liga no Twitter
        </p>
      </div>
      
      {/* Container responsivo para o widget do Twitter */}
      <div className="w-full overflow-hidden rounded-md">
        <a 
          className="twitter-timeline" 
          href="https://twitter.com/TFLeagueCO?ref_src=twsrc%5Etfw"
          data-height="400"
          data-theme={theme}
          data-chrome="noheader nofooter noborders transparent"
          data-tweet-limit="3"
          data-border-color="transparent"
        >
          Tweets by TFLeagueCO
        </a>
      </div>
    </div>
  );
}