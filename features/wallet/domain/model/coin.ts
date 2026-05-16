export type Coin = {
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: number;
    total_volume: number;
    price_change_percentage_24h: number | null;
};