import { NextRequest, NextResponse } from 'next/server';
import { fetchLeagueData, mapSleeperDataToTeams, fetchLeagueHistory, fetchMatchups, SleeperMatchup } from '@/lib/sleeper';
import { applyRankings, applySleeperDefaultRankings } from '@/lib/sort';
import { fetchPlayoffFinal } from '@/lib/playoffs';

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';

// Dados históricos manuais (antes do Sleeper)
function getManualHistoryData(leagueType: string): SeasonData[] {
  const manualSeasons: SeasonData[] = [];
  
  // Temporada 2016 - Dados manuais
  if (leagueType === 'redraft') {
    manualSeasons.push({
      year: '2016',
      leagueId: 'manual-2016', // ID fictício para dados manuais
      champion: {
         rosterId: 2, // ID fictício
         displayName: 'lzpck',
         wins: 11,
         losses: 3,
         ties: 0,
         pointsFor: 1541.02,
         seed: 2
       },
       runnerUp: {
         rosterId: 5, // ID fictício
         displayName: 'Vaideitarmateus',
         wins: 10,
         losses: 4,
         ties: 0,
         pointsFor: 1377.64,
         seed: 5
       },
      standings: [
          {
            rank: 1,
            displayName: 'leandroschultz_',
            wins: 12,
            losses: 2,
            ties: 0,
            pointsFor: 1598.84,
            pointsAgainst: 1201.48
          },
          {
            rank: 2,
            displayName: 'lzpck',
            wins: 11,
            losses: 3,
            ties: 0,
            pointsFor: 1541.02,
            pointsAgainst: 1178.28
          },
          {
            rank: 3,
            displayName: 'guilhermeln',
            wins: 10,
            losses: 4,
            ties: 0,
            pointsFor: 1642.78,
            pointsAgainst: 1333.34
          },
          {
            rank: 4,
            displayName: 'diasgeovani_',
            wins: 10,
            losses: 4,
            ties: 0,
            pointsFor: 1412.18,
            pointsAgainst: 1338.80
          },
          {
            rank: 5,
            displayName: 'Vaideitarmateus',
            wins: 10,
            losses: 4,
            ties: 0,
            pointsFor: 1377.64,
            pointsAgainst: 1267.48
          },
          {
            rank: 6,
            displayName: 'EstorvoMaldito',
            wins: 8,
            losses: 6,
            ties: 0,
            pointsFor: 1218.54,
            pointsAgainst: 1171.56
          },
          {
            rank: 7,
            displayName: 'victoryanlopes',
            wins: 6,
            losses: 8,
            ties: 0,
            pointsFor: 1275.28,
            pointsAgainst: 1411.62
          },
          {
            rank: 8,
            displayName: 'Brunio',
            wins: 6,
            losses: 8,
            ties: 0,
            pointsFor: 1250.22,
            pointsAgainst: 1370.96
          },
          {
            rank: 9,
            displayName: 'serrategaludo',
            wins: 6,
            losses: 8,
            ties: 0,
            pointsFor: 1250.08,
            pointsAgainst: 1265.76
          },
          {
            rank: 10,
            displayName: 'coverdolegolas',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1308.46,
            pointsAgainst: 1278.50
          },
          {
            rank: 11,
            displayName: 'rookiebugado',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1282.66,
            pointsAgainst: 1349.10
          },
          {
            rank: 12,
            displayName: 'GuilhermeDea',
            wins: 4,
            losses: 10,
            ties: 0,
            pointsFor: 1053.16,
            pointsAgainst: 1424.54
          },
          {
            rank: 13,
            displayName: 'oguistoso',
            wins: 3,
            losses: 11,
            ties: 0,
            pointsFor: 998.42,
            pointsAgainst: 1336.00
          },
          {
            rank: 14,
            displayName: 'J_emanuel99',
            wins: 2,
            losses: 12,
            ties: 0,
            pointsFor: 1022.70,
            pointsAgainst: 1304.56
          }
        ],
        // Incluir bracket para indicar que foi decidido nos playoffs
        bracket: {
          finalRound: 1 // Indica que houve playoffs
        },
       // Adicionar observação sobre dados históricos
       note: 'Antes de 2022 não utilizávamos o Sleeper para a liga, mas as regras eram as mesmas'
    });
    
    // Temporada 2017 - Dados manuais
    manualSeasons.push({
      year: '2017',
      leagueId: 'manual-2017', // ID fictício para dados manuais
      champion: {
         rosterId: 1, // ID fictício
         displayName: 'guilhermeln',
         wins: 11,
         losses: 3,
         ties: 0,
         pointsFor: 1777.74,
         seed: 1
       },
       runnerUp: {
         rosterId: 4, // ID fictício
         displayName: 'Cromosanity',
         wins: 8,
         losses: 6,
         ties: 0,
         pointsFor: 1550.50,
         seed: 4
       },
      standings: [
          {
            rank: 1,
            displayName: 'guilhermeln',
            wins: 11,
            losses: 3,
            ties: 0,
            pointsFor: 1777.74,
            pointsAgainst: 1568.54
          },
          {
            rank: 2,
            displayName: 'lzpck',
            wins: 11,
            losses: 3,
            ties: 0,
            pointsFor: 1704.82,
            pointsAgainst: 1452.76
          },
          {
            rank: 3,
            displayName: 'serrategaludo',
            wins: 9,
            losses: 5,
            ties: 0,
            pointsFor: 1700.96,
            pointsAgainst: 1485.02
          },
          {
            rank: 4,
            displayName: 'Cromosanity',
            wins: 8,
            losses: 6,
            ties: 0,
            pointsFor: 1550.50,
            pointsAgainst: 1564.94
          },
          {
            rank: 5,
            displayName: 'geovanosdays',
            wins: 8,
            losses: 6,
            ties: 0,
            pointsFor: 1493.24,
            pointsAgainst: 1559.88
          },
          {
            rank: 6,
            displayName: 'leandroschultz_',
            wins: 8,
            losses: 6,
            ties: 0,
            pointsFor: 1445.24,
            pointsAgainst: 1510.94
          },
          {
            rank: 7,
            displayName: 'Vaideitarmateus',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1605.58,
            pointsAgainst: 1582.42
          },
          {
            rank: 8,
            displayName: 'Brunio',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1484.50,
            pointsAgainst: 1493.54
          },
          {
            rank: 9,
            displayName: 'EstorvoMaldito',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1477.98,
            pointsAgainst: 1591.02
          },
          {
            rank: 10,
            displayName: 'coverdokisuke',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1457.70,
            pointsAgainst: 1422.08
          },
          {
            rank: 11,
            displayName: 'Gustavento',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1479.94,
            pointsAgainst: 1460.42
          },
          {
            rank: 12,
            displayName: 'victoryanlopes',
            wins: 4,
            losses: 10,
            ties: 0,
            pointsFor: 1455.04,
            pointsAgainst: 1550.94
          },
          {
            rank: 13,
            displayName: 'markellisson',
            wins: 4,
            losses: 10,
            ties: 0,
            pointsFor: 1325.48,
            pointsAgainst: 1481.88
          },
          {
            rank: 14,
            displayName: 'brunoscariot',
            wins: 2,
            losses: 12,
            ties: 0,
            pointsFor: 1433.96,
            pointsAgainst: 1433.96
          }
        ],
        // Incluir bracket para indicar que foi decidido nos playoffs
        bracket: {
          finalRound: 1 // Indica que houve playoffs
        },
       // Adicionar observação sobre dados históricos
       note: 'Antes de 2022 não utilizávamos o Sleeper para a liga, mas as regras eram as mesmas'
    });
    
    // Temporada 2018 - Dados manuais
    manualSeasons.push({
      year: '2018',
      leagueId: 'manual-2018', // ID fictício para dados manuais
      champion: {
         rosterId: 4, // ID fictício
         displayName: 'guilhermeln',
         wins: 9,
         losses: 5,
         ties: 0,
         pointsFor: 1767.34,
         seed: 4
       },
       runnerUp: {
         rosterId: 3, // ID fictício
         displayName: 'coverdolebron',
         wins: 9,
         losses: 5,
         ties: 0,
         pointsFor: 1782.56,
         seed: 3
       },
      standings: [
          {
            rank: 1,
            displayName: '_Lcsmagalhaes',
            wins: 13,
            losses: 1,
            ties: 0,
            pointsFor: 2029.24,
            pointsAgainst: 1584.62
          },
          {
            rank: 2,
            displayName: 'serrategaludo',
            wins: 11,
            losses: 3,
            ties: 0,
            pointsFor: 1663.68,
            pointsAgainst: 1580.20
          },
          {
            rank: 3,
            displayName: 'coverdolebron',
            wins: 9,
            losses: 5,
            ties: 0,
            pointsFor: 1782.56,
            pointsAgainst: 1629.42
          },
          {
            rank: 4,
            displayName: 'guilhermeln',
            wins: 9,
            losses: 5,
            ties: 0,
            pointsFor: 1767.34,
            pointsAgainst: 1677.02
          },
          {
            rank: 5,
            displayName: 'lzpck',
            wins: 8,
            losses: 6,
            ties: 0,
            pointsFor: 1797.36,
            pointsAgainst: 1755.62
          },
          {
            rank: 6,
            displayName: 'leandroschultz_',
            wins: 8,
            losses: 6,
            ties: 0,
            pointsFor: 1621.04,
            pointsAgainst: 1537.40
          },
          {
            rank: 7,
            displayName: 'Vaideitarmateus',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1779.82,
            pointsAgainst: 1685.76
          },
          {
            rank: 8,
            displayName: 'brunoscariot',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1552.86,
            pointsAgainst: 1670.52
          },
          {
            rank: 9,
            displayName: 'Brunio',
            wins: 6,
            losses: 8,
            ties: 0,
            pointsFor: 1658.20,
            pointsAgainst: 1697.06
          },
          {
            rank: 10,
            displayName: 'EstorvoMaldito',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1613.42,
            pointsAgainst: 1764.94
          },
          {
            rank: 11,
            displayName: 'geovanosdays',
            wins: 4,
            losses: 10,
            ties: 0,
            pointsFor: 1715.94,
            pointsAgainst: 1741.08
          },
          {
            rank: 12,
            displayName: 'markellisson',
            wins: 4,
            losses: 10,
            ties: 0,
            pointsFor: 1523.54,
            pointsAgainst: 1639.62
          },
          {
            rank: 13,
            displayName: 'victoryanlopes',
            wins: 4,
            losses: 10,
            ties: 0,
            pointsFor: 1444.40,
            pointsAgainst: 1564.28
          },
          {
            rank: 14,
            displayName: 'Gustavento',
            wins: 3,
            losses: 11,
            ties: 0,
            pointsFor: 1358.32,
            pointsAgainst: 1780.18
          }
        ],
        // Incluir bracket para indicar que foi decidido nos playoffs
        bracket: {
          finalRound: 1 // Indica que houve playoffs
        },
       // Adicionar observação sobre dados históricos
       note: 'Antes de 2022 não utilizávamos o Sleeper para a liga, mas as regras eram as mesmas'
    });
    
    // Temporada 2019 - Dados manuais
    manualSeasons.push({
      year: '2019',
      leagueId: 'manual-2019', // ID fictício para dados manuais
      champion: {
         rosterId: 2, // ID fictício
         displayName: 'RIP geovanosdays',
         wins: 10,
         losses: 4,
         ties: 0,
         pointsFor: 1830.88,
         seed: 2
       },
       runnerUp: {
         rosterId: 1, // ID fictício
         displayName: 'portaljoaom',
         wins: 11,
         losses: 3,
         ties: 0,
         pointsFor: 2221.84,
         seed: 1
       },
      standings: [
          {
            rank: 1,
            displayName: 'portaljoaom',
            wins: 11,
            losses: 3,
            ties: 0,
            pointsFor: 2221.84,
            pointsAgainst: 1855.38
          },
          {
            rank: 2,
            displayName: 'RIP geovanosdays',
            wins: 10,
            losses: 4,
            ties: 0,
            pointsFor: 1830.88,
            pointsAgainst: 1809.94
          },
          {
            rank: 3,
            displayName: 'coverdofagner',
            wins: 9,
            losses: 5,
            ties: 0,
            pointsFor: 1883.66,
            pointsAgainst: 1765.36
          },
          {
            rank: 4,
            displayName: 'mengocentrismo',
            wins: 8,
            losses: 6,
            ties: 0,
            pointsFor: 1974.58,
            pointsAgainst: 1885.76
          },
          {
            rank: 5,
            displayName: 'guilhermeln',
            wins: 8,
            losses: 6,
            ties: 0,
            pointsFor: 1965.28,
            pointsAgainst: 1928.74
          },
          {
            rank: 6,
            displayName: 'Casalmir',
            wins: 8,
            losses: 6,
            ties: 0,
            pointsFor: 1777.74,
            pointsAgainst: 1825.50
          },
          {
            rank: 7,
            displayName: 'lzpck',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1825.50,
            pointsAgainst: 1777.74
          },
          {
            rank: 8,
            displayName: 'Vaideitarmateus',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1777.74,
            pointsAgainst: 1825.50
          },
          {
            rank: 9,
            displayName: 'leandroschultz_',
            wins: 6,
            losses: 8,
            ties: 0,
            pointsFor: 1825.50,
            pointsAgainst: 1777.74
          },
          {
            rank: 10,
            displayName: 'Brunio',
            wins: 6,
            losses: 8,
            ties: 0,
            pointsFor: 1777.74,
            pointsAgainst: 1825.50
          },
          {
            rank: 11,
            displayName: 'serrategaludo',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1825.50,
            pointsAgainst: 1777.74
          },
          {
            rank: 12,
            displayName: 'EstorvoMaldito',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1777.74,
            pointsAgainst: 1825.50
          },
          {
            rank: 13,
            displayName: 'coverdolebron',
            wins: 4,
            losses: 10,
            ties: 0,
            pointsFor: 1825.50,
            pointsAgainst: 1777.74
          },
          {
            rank: 14,
            displayName: 'victoryanlopes',
            wins: 3,
            losses: 11,
            ties: 0,
            pointsFor: 1777.74,
            pointsAgainst: 1825.50
          }
        ],
        // Incluir bracket para indicar que foi decidido nos playoffs
        bracket: {
          finalRound: 1 // Indica que houve playoffs
        },
       // Adicionar observação sobre dados históricos
       note: 'Antes de 2022 não utilizávamos o Sleeper para a liga, mas as regras eram as mesmas'
    });
    
    // Temporada 2014 - Dados manuais
    manualSeasons.push({
      year: '2014',
      leagueId: 'manual-2014', // ID fictício para dados manuais
      champion: {
         rosterId: 1, // ID fictício
         displayName: 'lzpck',
         wins: 0,
         losses: 0,
         ties: 0,
         pointsFor: 0,
         seed: 1
       },
       runnerUp: null, // Dados não disponíveis
      standings: [],
        // Incluir bracket para indicar que foi decidido nos playoffs
        bracket: {
          finalRound: 1 // Indica que houve playoffs
        },
       // Adicionar observação sobre dados históricos
       note: 'Temporada de 2014 - Dados limitados disponíveis. Campeão: lzpck. O Sleeper não era utilizado antes de 2022.'
    });
    
    // Temporada 2015 - Dados manuais
    manualSeasons.push({
      year: '2015',
      leagueId: 'manual-2015', // ID fictício para dados manuais
      champion: {
         rosterId: 1, // ID fictício
         displayName: 'wonderwalluscas',
         wins: 0,
         losses: 0,
         ties: 0,
         pointsFor: 0,
         seed: 1
       },
       runnerUp: null, // Dados não disponíveis
      standings: [],
        // Incluir bracket para indicar que foi decidido nos playoffs
        bracket: {
          finalRound: 1 // Indica que houve playoffs
        },
       // Adicionar observação sobre dados históricos
       note: 'Temporada de 2015 - Dados limitados disponíveis. Campeão: wonderwalluscas. O Sleeper não era utilizado antes de 2022.'
    });
    
    // Temporada 2020 - Dados manuais
    manualSeasons.push({
      year: '2020',
      leagueId: 'manual-2020', // ID fictício para dados manuais
      champion: {
         rosterId: 3, // ID fictício
         displayName: 'Markellisson',
         wins: 9,
         losses: 5,
         ties: 0,
         pointsFor: 2068.66,
         seed: 3
       },
       runnerUp: {
         rosterId: 4, // ID fictício
         displayName: 'orondonia',
         wins: 9,
         losses: 5,
         ties: 0,
         pointsFor: 2046.48,
         seed: 4
       },
      standings: [
          {
            rank: 1,
            displayName: 'portaljacom',
            wins: 10,
            losses: 4,
            ties: 0,
            pointsFor: 2180.62,
            pointsAgainst: 1857.80
          },
          {
            rank: 2,
            displayName: 'Brunio',
            wins: 10,
            losses: 4,
            ties: 0,
            pointsFor: 1842.14,
            pointsAgainst: 1728.02
          },
          {
            rank: 3,
            displayName: 'Markellisson',
            wins: 9,
            losses: 5,
            ties: 0,
            pointsFor: 2068.66,
            pointsAgainst: 1855.18
          },
          {
            rank: 4,
            displayName: 'orondonia',
            wins: 9,
            losses: 5,
            ties: 0,
            pointsFor: 2046.48,
            pointsAgainst: 1735.34
          },
          {
            rank: 5,
            displayName: 'mistereliable',
            wins: 9,
            losses: 5,
            ties: 0,
            pointsFor: 1898.22,
            pointsAgainst: 1843.92
          },
          {
            rank: 6,
            displayName: '_Lcsmagalhaes',
            wins: 8,
            losses: 8,
            ties: 0,
            pointsFor: 1994.46,
            pointsAgainst: 1685.02
          },
          {
            rank: 7,
            displayName: 'lzpck',
            wins: 8,
            losses: 8,
            ties: 0,
            pointsFor: 1779.20,
            pointsAgainst: 1910.78
          },
          {
            rank: 8,
            displayName: 'Casalmir',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1800.64,
            pointsAgainst: 1743.46
          },
          {
            rank: 9,
            displayName: 'guilhermeln',
            wins: 6,
            losses: 8,
            ties: 0,
            pointsFor: 1753.80,
            pointsAgainst: 1824.58
          },
          {
            rank: 10,
            displayName: 'vaideitarmaconha',
            wins: 6,
            losses: 8,
            ties: 0,
            pointsFor: 1738.24,
            pointsAgainst: 1986.44
          },
          {
            rank: 11,
            displayName: 'ggtntt',
            wins: 6,
            losses: 8,
            ties: 0,
            pointsFor: 1698.62,
            pointsAgainst: 1778.66
          },
          {
            rank: 12,
            displayName: 'victoryanlopes',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1751.98,
            pointsAgainst: 1996.30
          },
          {
            rank: 13,
            displayName: 'qkisuke',
            wins: 3,
            losses: 11,
            ties: 0,
            pointsFor: 1638.32,
            pointsAgainst: 1772.30
          },
          {
            rank: 14,
            displayName: 'serrategaludo',
            wins: 2,
            losses: 12,
            ties: 0,
            pointsFor: 1372.18,
            pointsAgainst: 1853.58
          }
        ],
        // Incluir bracket para indicar que foi decidido nos playoffs
        bracket: {
          finalRound: 1 // Indica que houve playoffs
        },
       // Adicionar observação sobre dados históricos
       note: 'Antes de 2022 não utilizávamos o Sleeper para a liga, mas as regras eram as mesmas'
    });
    
    // Temporada 2021 - Dados manuais
    manualSeasons.push({
      year: '2021',
      leagueId: 'manual-2021', // ID fictício para dados manuais
      champion: {
         rosterId: 1, // ID fictício
         displayName: 'Casalmir',
         wins: 13,
         losses: 1,
         ties: 0,
         pointsFor: 1817.16,
         seed: 1
       },
       runnerUp: {
         rosterId: 2, // ID fictício
         displayName: 'guilhermeln',
         wins: 11,
         losses: 3,
         ties: 0,
         pointsFor: 1826.40,
         seed: 2
       },
      standings: [
          {
            rank: 1,
            displayName: 'Casalmir',
            wins: 13,
            losses: 1,
            ties: 0,
            pointsFor: 1817.16,
            pointsAgainst: 1437.26
          },
          {
            rank: 2,
            displayName: 'guilhermeln',
            wins: 11,
            losses: 3,
            ties: 0,
            pointsFor: 1826.40,
            pointsAgainst: 1421.24
          },
          {
            rank: 3,
            displayName: 'Diego_Guedes19',
            wins: 10,
            losses: 4,
            ties: 0,
            pointsFor: 1724.68,
            pointsAgainst: 1478.04
          },
          {
            rank: 4,
            displayName: 'mistereliable',
            wins: 9,
            losses: 5,
            ties: 0,
            pointsFor: 1550.74,
            pointsAgainst: 1502.48
          },
          {
            rank: 5,
            displayName: 'portaljrmcs',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1579.68,
            pointsAgainst: 1655.02
          },
          {
            rank: 6,
            displayName: '_Lcsmagalhaes',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1509.08,
            pointsAgainst: 1485.46
          },
          {
            rank: 7,
            displayName: 'Brunio',
            wins: 7,
            losses: 7,
            ties: 0,
            pointsFor: 1502.96,
            pointsAgainst: 1546.18
          },
          {
            rank: 8,
            displayName: 'kisuke',
            wins: 8,
            losses: 6,
            ties: 0,
            pointsFor: 1522.88,
            pointsAgainst: 1574.74
          },
          {
            rank: 9,
            displayName: 'victoryanlopes',
            wins: 6,
            losses: 8,
            ties: 0,
            pointsFor: 1401.72,
            pointsAgainst: 1356.94
          },
          {
            rank: 10,
            displayName: 'orondonia',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1504.22,
            pointsAgainst: 1516.64
          },
          {
            rank: 11,
            displayName: 'vaideitarmaconha',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1359.18,
            pointsAgainst: 1487.78
          },
          {
            rank: 12,
            displayName: 'lzpck',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1349.86,
            pointsAgainst: 1638.50
          },
          {
            rank: 13,
            displayName: 'leandroschultz_',
            wins: 5,
            losses: 9,
            ties: 0,
            pointsFor: 1337.64,
            pointsAgainst: 1419.22
          },
          {
            rank: 14,
            displayName: 'Markellisson',
            wins: 2,
            losses: 12,
            ties: 0,
            pointsFor: 1163.02,
            pointsAgainst: 1649.92
          }
        ],
        // Incluir bracket para indicar que foi decidido nos playoffs
        bracket: {
          finalRound: 1 // Indica que houve playoffs
        },
       // Adicionar observação sobre dados históricos
       note: 'Antes de 2022 não utilizávamos o Sleeper para a liga, mas as regras eram as mesmas'
    });
  }
  
  return manualSeasons;
}

// Interface para dados de uma temporada
interface SeasonData {
  year: string;
  leagueId: string;
  champion: {
    rosterId: number;
    displayName: string;
    avatar?: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    seed?: number;
  } | null;
  runnerUp: {
    rosterId: number;
    displayName: string;
    avatar?: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    seed?: number;
  } | null;
  standings: Array<{
    rank: number;
    displayName: string;
    avatar?: string;
    ownerId?: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
  }>;
  bracket?: {
    finalRound: number;
  };
  note?: string; // Observação adicional para dados históricos
}

interface MatchUser {
  userId: string;
  displayName: string;
  avatar?: string;
  score: number;
}

interface HistoricalMatch {
  season: string;
  week: number;
  userA: MatchUser;
  userB: MatchUser;
  winnerUserId: string | null;
}

// Interface para resposta da API
interface HistoryResponse {
  leagueType: string;
  seasons: SeasonData[];
  matches: HistoricalMatch[];
}

// Função para buscar partidas de uma temporada
async function fetchSeasonMatches(
  leagueId: string,
  year: string
): Promise<HistoricalMatch[]> {
  try {
    // Buscar dados da liga para mapeamento de usuários
    const { league, users, rosters } = await fetchLeagueData(leagueId, true);
    
    if (!league || !users || !rosters) {
      return [];
    }
    
    // Mapear Roster ID -> User Data
    const rosterMap = new Map<number, { userId: string; displayName: string; avatarUrl?: string }>();
    const teams = mapSleeperDataToTeams(users, rosters);
    
    teams.forEach(t => {
      rosterMap.set(t.rosterId, {
        userId: t.ownerId,
        displayName: t.displayName,
        avatarUrl: t.avatarUrl
      });
    });
    
    // Determinar semanas da temporada regular
    // Se playoff_week_start não estiver definido, assumimos 15 (padrão antigo comum)
    const playoffStart = league.settings.playoff_week_start || 15;
    const regularSeasonWeeks = playoffStart - 1;
    
    // Buscar matchups de todas as semanas em paralelo
    const weeks = Array.from({ length: regularSeasonWeeks }, (_, i) => i + 1);
    
    const weeksData = await Promise.all(
      weeks.map(async (week) => {
        try {
          const weeklyMatchups = await fetchMatchups(leagueId, week, true);
          return { week, weeklyMatchups };
        } catch (e) {
          console.error(`Erro ao buscar semana ${week} da liga ${leagueId}:`, e);
          return { week, weeklyMatchups: [] };
        }
      })
    );
    
    const matches: HistoricalMatch[] = [];
    
    for (const { week, weeklyMatchups } of weeksData) {
      if (!weeklyMatchups || weeklyMatchups.length === 0) continue;

      // Agrupar por matchup_id
      const matchupsById = new Map<number, SleeperMatchup[]>();
      weeklyMatchups.forEach(m => {
        if (!matchupsById.has(m.matchup_id)) matchupsById.set(m.matchup_id, []);
        matchupsById.get(m.matchup_id)?.push(m);
      });
      
      for (const [, sides] of matchupsById) {
        if (sides.length === 2) {
          const sideA = sides[0];
          const sideB = sides[1];
          
          const userA = rosterMap.get(sideA.roster_id);
          const userB = rosterMap.get(sideB.roster_id);
          
          // Apenas considerar matchups válidos com usuários mapeados
          if (userA && userB) {
            // Determinar vencedor
            let winnerUserId: string | null = null;
            // Usar roste_id como identificador temporário se userId for 'unknown' ou similar,
            // mas aqui queremos o userId real. Se for 'unknown', o H2H pode falhar, mas ok.
            
            if (sideA.points > sideB.points) winnerUserId = userA.userId;
            else if (sideB.points > sideA.points) winnerUserId = userB.userId;
            
            matches.push({
              season: year,
              week,
              userA: { 
                userId: userA.userId, 
                displayName: userA.displayName, 
                avatar: userA.avatarUrl,
                score: sideA.points 
              },
              userB: { 
                userId: userB.userId, 
                displayName: userB.displayName, 
                avatar: userB.avatarUrl,
                score: sideB.points 
              },
              winnerUserId
            });
          }
        }
      }
    }
    
    return matches;
    
  } catch (error) {
    console.error(`Erro ao buscar partidas da temporada ${year}:`, error);
    return [];
  }
}

// Função para buscar dados de uma temporada específica
async function fetchSeasonData(
  leagueId: string, 
  year: string, 
  leagueType: string,
  isCurrentSeason: boolean
): Promise<SeasonData | null> {
  try {
    // Buscar dados do Sleeper (cache mais agressivo para anos anteriores)
    const { league, users, rosters } = await fetchLeagueData(leagueId, !isCurrentSeason);
    
    // Verificar se os dados são válidos
    if (!league) {
      console.warn(`Liga ${leagueId} não encontrada para o ano ${year}`);
      return null;
    }
    
    if (!Array.isArray(users) || users.length === 0) {
      console.warn(`Nenhum usuário encontrado para a liga ${leagueId} (${year})`);
      return null;
    }
    
    if (!Array.isArray(rosters) || rosters.length === 0) {
      console.warn(`Nenhum roster encontrado para a liga ${leagueId} (${year})`);
      return null;
    }
    
    // Mapear dados para o formato interno
    const teamsWithoutRank = mapSleeperDataToTeams(users, rosters);
    
    // Verificar se conseguimos mapear pelo menos um time
    if (teamsWithoutRank.length === 0) {
      console.warn(`Nenhum time válido encontrado para a liga ${leagueId} (${year})`);
      return null;
    }
    
    // Aplicar rankings
    // Para o ano atual, mantemos a lógica customizada
    // Para anos anteriores (2022+), usamos os dados diretos do Sleeper
    const teams = isCurrentSeason 
      ? applyRankings(teamsWithoutRank, leagueType as 'redraft' | 'dynasty')
      : applySleeperDefaultRankings(teamsWithoutRank);
    
    // Ordenar por ranking
    const sortedTeams = teams.sort((a, b) => a.rank - b.rank);
    
    // Buscar dados dos playoffs para determinar campeão e vice
    const playoffResult = await fetchPlayoffFinal(leagueId);
    
    let champion = null;
    let runnerUp = null;
    let bracket = undefined;
    
    if (playoffResult) {
      // Encontrar campeão e vice pelos playoffs
      const championTeam = teams.find(team => team.rosterId === playoffResult.championRosterId);
      const runnerUpTeam = teams.find(team => team.rosterId === playoffResult.runnerUpRosterId);
      
      champion = championTeam ? {
        rosterId: championTeam.rosterId,
        displayName: championTeam.displayName,
        wins: championTeam.wins,
        losses: championTeam.losses,
        ties: championTeam.ties,
        pointsFor: championTeam.pointsFor,
        seed: championTeam.rank,
        avatar: championTeam.avatarUrl
      } : null;
      
      runnerUp = runnerUpTeam ? {
        rosterId: runnerUpTeam.rosterId,
        displayName: runnerUpTeam.displayName,
        wins: runnerUpTeam.wins,
        losses: runnerUpTeam.losses,
        ties: runnerUpTeam.ties,
        pointsFor: runnerUpTeam.pointsFor,
        seed: runnerUpTeam.rank,
        avatar: runnerUpTeam.avatarUrl
      } : null;
      
      bracket = {
        finalRound: playoffResult.finalRound
      };
    } else {
      // Fallback: usar standings se playoffs não estiverem disponíveis
      console.warn(`Playoffs não encontrados para liga ${leagueId} (${year}), usando standings como fallback`);
      
      champion = sortedTeams[0] ? {
        rosterId: sortedTeams[0].rosterId,
        displayName: sortedTeams[0].displayName,
        wins: sortedTeams[0].wins,
        losses: sortedTeams[0].losses,
        ties: sortedTeams[0].ties,
        pointsFor: sortedTeams[0].pointsFor,
        seed: sortedTeams[0].rank,
        avatar: sortedTeams[0].avatarUrl
      } : null;
      
      runnerUp = sortedTeams[1] ? {
        rosterId: sortedTeams[1].rosterId,
        displayName: sortedTeams[1].displayName,
        wins: sortedTeams[1].wins,
        losses: sortedTeams[1].losses,
        ties: sortedTeams[1].ties,
        pointsFor: sortedTeams[1].pointsFor,
        seed: sortedTeams[1].rank,
        avatar: sortedTeams[1].avatarUrl
      } : null;
    }
    
    // Mapear standings completos
    const standings = sortedTeams.map(team => ({
      rank: team.rank,
      displayName: team.displayName,
      avatar: team.avatarUrl,
      ownerId: team.ownerId, 
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst
    }));
    
    return {
      year,
      leagueId,
      champion,
      runnerUp,
      standings,
      bracket
    };
  } catch (error) {
    console.error(`Erro ao buscar dados da temporada ${year} (${leagueId}):`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueType = searchParams.get('leagueType');
    
    // Validação do parâmetro leagueType
    if (!leagueType || !['redraft', 'dynasty'].includes(leagueType)) {
      return NextResponse.json(
        { error: 'Parâmetro "leagueType" deve ser "redraft" ou "dynasty"' },
        { status: 400 }
      );
    }
    
    // Determinar o ID da liga atual
    let currentLeagueId = '';
    
    if (leagueType === 'redraft') {
      // Prioridade: Variável específica > Variável genérica > Ligas legadas
      currentLeagueId = process.env.LEAGUE_ID_REDRAFT || process.env.LEAGUE_ID || process.env.LEAGUE_ID_REDRAFT_2024 || '';
    } else if (leagueType === 'dynasty') {
      currentLeagueId = process.env.LEAGUE_ID_DYNASTY || process.env.LEAGUE_ID_DYNASTY_2024 || '';
    }
    
    if (!currentLeagueId) {
      return NextResponse.json(
        { error: `Nenhum ID de liga configurado para ${leagueType}` },
        { status: 404 }
      );
    }

    console.log(`[API] Buscando histórico para ${leagueType} a partir de ${currentLeagueId}`);
    
    // Buscar histórico de ligas recursivamente
    const historyMap = await fetchLeagueHistory(currentLeagueId);
    
    // Filtrar apenas anos relevantes para o Sleeper (>= 2022)
    const validYears = Object.keys(historyMap).filter(year => parseInt(year) >= 2022);
    
    console.log(`[API] Anos encontrados no Sleeper: ${validYears.join(', ')}`);

    // Buscar dados de todas as temporadas em paralelo
    const seasonPromises = validYears.map(year => {
      const leagueId = historyMap[year];
      // A liga atual é a que iniciou a busca (currentLeagueId)
      // OU a que tem o ano mais recente (caso currentLeagueId seja de um ano anterior, o que não deve ocorrer no fluxo normal)
      const isCurrentSeason = leagueId === currentLeagueId;
      
      return fetchSeasonData(leagueId, year, leagueType, isCurrentSeason);
    });
    
    // Buscar partidas históricas em paralelo
    const matchesPromises = validYears.map(year => {
      const leagueId = historyMap[year];
      return fetchSeasonMatches(leagueId, year);
    });

    const [seasonResults, matchesResults] = await Promise.all([
      Promise.all(seasonPromises),
      Promise.all(matchesPromises)
    ]);
    
    // Flatten arrays de partidas
    const allMatches = matchesResults.flat();
    
    // Filtrar resultados válidos de temporada
    const sleeperSeasons = seasonResults
      .filter((season): season is SeasonData => season !== null);
    
    // Buscar dados históricos manuais
    const manualSeasons = getManualHistoryData(leagueType);
    
    // Combinar dados do Sleeper com dados manuais e ordenar por ano (mais recente primeiro)
    const allSeasons = [...sleeperSeasons, ...manualSeasons]
      .sort((a, b) => parseInt(b.year) - parseInt(a.year));

    const response: HistoryResponse = {
      leagueType,
      seasons: allSeasons,
      matches: allMatches
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro na API de histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}