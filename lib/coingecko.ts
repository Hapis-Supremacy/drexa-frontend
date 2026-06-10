import type { CoinData } from '@/features/core/domain/model'

const BASE = 'https://api.coingecko.com/api/v3'

export const COIN_ID: Record<string, string> = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  SOL:  'solana',
  BNB:  'binancecoin',
  XRP:  'ripple',
  ADA:  'cardano',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  DOGE: 'dogecoin',
}

const SYM_FROM_ID: Record<string, string> = Object.fromEntries(
  Object.entries(COIN_ID).map(([sym, id]) => [id, sym])
)

// days param + optional tail-slice per UI range label
// CoinGecko auto-granularity: days=1 → 5-min data (~288pts), days≤90 → hourly, days>90 → daily
const RANGE_CONFIG: Record<string, { days: string; slice?: number }> = {
  '1H': { days: '1', slice: 12 },  // last 12×5min = ~1 hour
  '1D': { days: '1' },
  '1W': { days: '7' },
  '1M': { days: '30' },
  '1Y': { days: '365' },
}

function cgHeaders(): HeadersInit {
  const key = process.env.NEXT_PUBLIC_COINGECKO_API_KEY
  return key ? { 'x-cg-demo-api-key': key } : {}
}

export interface CgMarketCoin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  price_change_percentage_24h: number
  circulating_supply: number
  sparkline_in_7d: { price: number[] }
}

export async function fetchMarkets(): Promise<CgMarketCoin[]> {
  const ids = Object.values(COIN_ID).join(',')
  const res = await fetch(
    `${BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=20&sparkline=true&price_change_percentage=24h`,
    { headers: cgHeaders() },
  )
  if (!res.ok) throw new Error(`CoinGecko /markets ${res.status}`)
  return res.json()
}

export async function fetchChartData(sym: string, range: string): Promise<number[]> {
  const id = COIN_ID[sym]
  if (!id) return []
  const cfg = RANGE_CONFIG[range] ?? { days: '7' }
  const res = await fetch(
    `${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${cfg.days}`,
    { headers: cgHeaders() },
  )
  if (!res.ok) throw new Error(`CoinGecko /market_chart ${res.status}`)
  const data: { prices: [number, number][] } = await res.json()
  const prices = data.prices.map(([, p]) => p)
  return cfg.slice ? prices.slice(-cfg.slice) : prices
}

export function cgToCoinData(cg: CgMarketCoin): CoinData {
  return {
    sym:    SYM_FROM_ID[cg.id] ?? cg.symbol.toUpperCase(),
    name:   cg.name,
    price:  cg.current_price,
    ch:     cg.price_change_percentage_24h ?? 0,
    vol:    cg.total_volume,
    mcap:   cg.market_cap,
    supply: cg.circulating_supply,
    seed:   0,
    spark:  cg.sparkline_in_7d?.price ?? [],
    rank:   cg.market_cap_rank,
  }
}
