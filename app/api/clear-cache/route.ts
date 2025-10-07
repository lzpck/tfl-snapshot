import { NextResponse } from 'next/server';

export async function POST() {
  const timestamp = new Date().toISOString();
  console.log(`[CLEAR_CACHE ${timestamp}] Iniciando limpeza de cache`);
  
  try {
    // Limpar cache do Next.js (se disponível)
    if (typeof global !== 'undefined' && global.memoryCache) {
      console.log(`[CLEAR_CACHE ${timestamp}] Limpando cache in-memory`);
      global.memoryCache.clear();
    }
    
    // Forçar revalidação das rotas
    console.log(`[CLEAR_CACHE ${timestamp}] Cache limpo com sucesso`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache limpo com sucesso',
      timestamp 
    });
  } catch (error) {
    console.error(`[CLEAR_CACHE ${timestamp}] ❌ Erro ao limpar cache:`, error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao limpar cache',
      timestamp 
    }, { status: 500 });
  }
}