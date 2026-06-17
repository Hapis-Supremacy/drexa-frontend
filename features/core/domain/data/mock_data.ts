import type { CoinData, CoinStyle, Holding, HoldingRow, OpenOrder, HistoryOrder, Fill, Activity, PortfolioTotals } from '../model';
import { series } from './trading_utils';
import type { TickerData } from '../../presentation/hooks/use_market_stream';

export const COIN_STYLE: Record<string, CoinStyle> = {
  BTC:  { bg: '#F7931A',                                   glyph: '₿', fg: '#fff' },
  ETH:  { bg: '#627EEA',                                   glyph: 'Ξ', fg: '#fff' },
  SOL:  { bg: 'linear-gradient(135deg,#00FFA3,#3B82F6)',   glyph: 'S', fg: '#0b1020' },
  USDT: { bg: '#26A17B',                                   glyph: '₮', fg: '#fff' },
  BNB:  { bg: '#F3BA2F',                                   glyph: 'B', fg: '#0b1020' },
  XRP:  { bg: '#23292F',                                   glyph: 'X', fg: '#fff' },
  ADA:  { bg: '#0033AD',                                   glyph: '₳', fg: '#fff' },
  DOGE: { bg: '#C2A633',                                   glyph: 'Ð', fg: '#0b1020' },
  AVAX: { bg: '#E84142',                                   glyph: 'A', fg: '#fff' },
  LINK: { bg: '#2A5ADA',                                   glyph: 'L', fg: '#fff' },
};

export const DONUT_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#00FFA3', LINK: '#2A5ADA',
  USDT: '#26A17B', BNB: '#F3BA2F', AVAX: '#E84142',
};

const RAW_COINS: Omit<CoinData, 'spark'>[] = [
  { sym: 'BTC',  name: 'Bitcoin',    price: 64182.50, ch: 2.41,  vol: 1284.3e6, mcap: 1264e9, supply: 19.7e6,   seed: 7  },
  { sym: 'ETH',  name: 'Ethereum',   price: 3108.74,  ch: -1.08, vol: 842.1e6,  mcap: 373e9,  supply: 120.1e6,  seed: 13 },
  { sym: 'SOL',  name: 'Solana',     price: 148.20,   ch: 5.62,  vol: 410.7e6,  mcap: 68e9,   supply: 458.9e6,  seed: 21 },
  { sym: 'BNB',  name: 'BNB',        price: 592.16,   ch: 0.84,  vol: 230.4e6,  mcap: 87e9,   supply: 147.6e6,  seed: 29 },
  { sym: 'XRP',  name: 'XRP',        price: 0.5284,   ch: -2.31, vol: 188.9e6,  mcap: 29e9,   supply: 54.8e9,   seed: 37 },
  { sym: 'ADA',  name: 'Cardano',    price: 0.4471,   ch: 3.12,  vol: 95.2e6,   mcap: 15.8e9, supply: 35.3e9,   seed: 45 },
  { sym: 'AVAX', name: 'Avalanche',  price: 36.78,    ch: -0.57, vol: 77.6e6,   mcap: 14.4e9, supply: 391.4e6,  seed: 53 },
  { sym: 'LINK', name: 'Chainlink',  price: 17.42,    ch: 4.08,  vol: 64.1e6,   mcap: 10.2e9, supply: 587.1e6,  seed: 61 },
  { sym: 'DOGE', name: 'Dogecoin',   price: 0.1583,   ch: 6.94,  vol: 121.5e6,  mcap: 22.7e9, supply: 143.4e9,  seed: 69 },
];

export const COINS: CoinData[] = RAW_COINS.map(c => ({
  ...c,
  spark: series(c.seed, 24, 0.06, c.price),
}));

export const ABOUT: Record<string, string> = {
  BTC:  'Bitcoin is the first decentralized digital currency, introduced in 2009. It runs on a peer-to-peer network secured by proof-of-work, with a fixed supply cap of 21 million coins.',
  ETH:  'Ethereum is a programmable blockchain that powers smart contracts and decentralized applications. ETH is the native asset used to pay for computation on the network.',
  SOL:  'Solana is a high-throughput layer-1 blockchain designed for low fees and fast settlement, using a proof-of-history consensus to order transactions efficiently.',
  BNB:  'BNB is the native asset of the BNB Chain ecosystem, used for transaction fees, staking, and access to applications across the network.',
  XRP:  'XRP is the digital asset native to the XRP Ledger, built for fast, low-cost cross-border value transfer and settlement.',
  ADA:  'Cardano is a proof-of-stake blockchain platform developed with a research-driven, peer-reviewed approach to building secure smart-contract infrastructure.',
  AVAX: 'Avalanche is a layer-1 platform for decentralized applications and custom blockchain networks, known for fast finality and subnets.',
  LINK: 'Chainlink is a decentralized oracle network that connects smart contracts with real-world data, events, and off-chain computation.',
  DOGE: 'Dogecoin is a peer-to-peer digital currency that began as a lighthearted project and is now used widely for tipping and small payments.',
};

export function coinOf(sym: string): CoinData {
  return COINS.find(c => c.sym === sym) ?? COINS[0];
}

export const HOLDINGS: Holding[] = [
  { sym: 'BTC',  qty: 0.1312, avg: 58200 },
  { sym: 'ETH',  qty: 1.84,   avg: 3320  },
  { sym: 'SOL',  qty: 22.5,   avg: 121.4 },
  { sym: 'LINK', qty: 140,    avg: 14.8  },
  { sym: 'USDT', qty: 1240,   avg: 1     },
];

export function holdingRows(tickers?: Record<string, TickerData>): HoldingRow[] {
  return HOLDINGS.map(h => {
    const c = coinOf(h.sym);
    const price = h.sym === 'USDT' ? 1 : (tickers?.[h.sym]?.price ?? c.price);
    const value = h.qty * price, cost = h.qty * h.avg, pnl = value - cost;
    const ch = h.sym === 'USDT' ? 0 : (tickers?.[h.sym]?.ch ?? c.ch);
    return {
      ...h, price, value, cost, pnl,
      pnlPct: cost ? (pnl / cost) * 100 : 0,
      name: h.sym === 'USDT' ? 'Tether' : c.name,
      ch,
    };
  }).sort((a, b) => b.value - a.value);
}

export function portfolioTotals(tickers?: Record<string, TickerData>): PortfolioTotals {
  const rows = holdingRows(tickers);
  const value = rows.reduce((a, r) => a + r.value, 0);
  const cost  = rows.reduce((a, r) => a + r.cost,  0);
  return { rows, value, cost, pnl: value - cost, pnlPct: cost ? ((value - cost) / cost) * 100 : 0, today: value * 0.0184 };
}

export const NETWORKS: Record<string, string[]> = {
  BTC:  ['Bitcoin'],
  ETH:  ['Ethereum (ERC-20)', 'Arbitrum One'],
  SOL:  ['Solana'],
  USDT: ['Tron (TRC-20)', 'Ethereum (ERC-20)', 'Solana'],
  BNB:  ['BNB Smart Chain (BEP-20)'],
  LINK: ['Ethereum (ERC-20)'],
  XRP:  ['XRP Ledger'],
  ADA:  ['Cardano'],
  AVAX: ['Avalanche C-Chain'],
  DOGE: ['Dogecoin'],
};

export const DEPOSIT_ADDRS: Record<string, string> = {
  BTC:     'bc1qx9drexa7k2m4lq8vn3p0fz5h6cytw8e4r2sd9u',
  ETH:     '0x7A3f9C2b48D1eF06aB5c91D2e8F4a07B3c6d9E1f',
  SOL:     '5Drx9aK2mPqL4vN8tZ7yH3bWcE6fG1sJxU0RoY2dV4n',
  USDT:    'TQ9DrexaWk7m2L4pVn8z3HfY6ct5Be1Rsd',
  default: '0x7A3f9C2b48D1eF06aB5c91D2e8F4a07B3c6d9E1f',
};

export const OPEN_ORDERS: OpenOrder[] = [
  { id: '#A-91842', side: 'buy',  type: 'Limit',  sym: 'BTC',  price: 62250.00, amt: 0.0500, filled: 0,  time: 'Today · 10:24' },
  { id: '#A-91776', side: 'sell', type: 'Limit',  sym: 'ETH',  price: 3260.00,  amt: 0.4000, filled: 12, time: 'Today · 09:58' },
  { id: '#A-91640', side: 'buy',  type: 'Limit',  sym: 'SOL',  price: 138.00,   amt: 8.0000, filled: 35, time: 'Today · 08:41' },
  { id: '#A-91588', side: 'sell', type: 'Stop',   sym: 'LINK', price: 15.20,    amt: 60.000, filled: 0,  time: 'Yesterday · 21:12' },
];

export const ORDER_HISTORY: HistoryOrder[] = [
  { id: '#A-90211', side: 'buy',  type: 'Market', sym: 'SOL',  price: 146.80,   amt: 12.500, status: 'Filled',    time: 'Today · 10:24' },
  { id: '#A-90188', side: 'sell', type: 'Limit',  sym: 'ETH',  price: 3290.00,  amt: 0.4000, status: 'Filled',    time: 'May 28 · 14:11' },
  { id: '#A-90094', side: 'buy',  type: 'Limit',  sym: 'BTC',  price: 62800.00, amt: 0.0500, status: 'Filled',    time: 'May 27 · 09:36' },
  { id: '#A-89977', side: 'buy',  type: 'Limit',  sym: 'AVAX', price: 34.00,    amt: 20.000, status: 'Cancelled', time: 'May 26 · 16:50' },
  { id: '#A-89820', side: 'sell', type: 'Market', sym: 'DOGE', price: 0.1610,   amt: 4000.0, status: 'Filled',    time: 'May 25 · 11:02' },
  { id: '#A-89714', side: 'buy',  type: 'Limit',  sym: 'LINK', price: 14.50,    amt: 80.000, status: 'Expired',   time: 'May 24 · 19:33' },
];

export const FILLS: Fill[] = [
  { sym: 'SOL',  side: 'buy',  price: 146.80,   amt: 12.500, fee: 1.83, role: 'Taker', time: 'Today · 10:24' },
  { sym: 'SOL',  side: 'buy',  price: 145.10,   amt: 4.2000, fee: 0.61, role: 'Maker', time: 'Today · 09:01' },
  { sym: 'ETH',  side: 'sell', price: 3290.00,  amt: 0.4000, fee: 1.32, role: 'Maker', time: 'May 28 · 14:11' },
  { sym: 'BTC',  side: 'buy',  price: 62800.00, amt: 0.0500, fee: 3.14, role: 'Taker', time: 'May 27 · 09:36' },
  { sym: 'DOGE', side: 'sell', price: 0.1610,   amt: 4000.0, fee: 0.64, role: 'Taker', time: 'May 25 · 11:02' },
];

export const ACTIVITY: Activity[] = [
  { t: 'Buy',      sym: 'SOL',  amt: 12.5, val: 1852.5, time: 'Today · 10:24',     dir: 'in'  },
  { t: 'Deposit',  sym: 'USDT', amt: 1000, val: 1000,   time: 'Yesterday · 18:02', dir: 'in'  },
  { t: 'Sell',     sym: 'ETH',  amt: 0.4,  val: 1316.0, time: 'May 28 · 14:11',    dir: 'out' },
  { t: 'Buy',      sym: 'BTC',  amt: 0.05, val: 3140.0, time: 'May 27 · 09:36',    dir: 'in'  },
  { t: 'Withdraw', sym: 'USDT', amt: 500,  val: 500,    time: 'May 26 · 08:15',    dir: 'out' },
];
