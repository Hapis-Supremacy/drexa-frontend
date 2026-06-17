export interface CoinData {
  sym: string;
  name: string;
  price: number;
  ch: number;
  vol: number;
  mcap: number;
  supply: number;
  seed: number;
  spark: number[];
  rank?: number;
  high?: number;
  low?: number;
}

export interface CoinStyle {
  bg: string;
  glyph: string;
  fg: string;
}

export interface Holding {
  sym: string;
  qty: number;
  avg: number;
}

export interface HoldingRow extends Holding {
  price: number;
  value: number;
  cost: number;
  pnl: number;
  pnlPct: number;
  name: string;
  ch: number;
}

export interface OpenOrder {
  id: string;
  side: 'buy' | 'sell';
  type: string;
  sym: string;
  price: number;
  amt: number;
  filled: number;
  time: string;
}

export interface HistoryOrder {
  id: string;
  side: 'buy' | 'sell';
  type: string;
  sym: string;
  price: number;
  amt: number;
  status: string;
  time: string;
}

export interface Fill {
  sym: string;
  side: 'buy' | 'sell';
  price: number;
  amt: number;
  fee: number;
  role: string;
  time: string;
}

export interface Activity {
  t: string;
  sym: string;
  amt: number;
  val: number;
  time: string;
  dir: 'in' | 'out';
}

export interface PortfolioTotals {
  rows: HoldingRow[];
  value: number;
  cost: number;
  pnl: number;
  pnlPct: number;
  today: number;
}
