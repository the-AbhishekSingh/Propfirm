import { create } from 'zustand';

interface OrderBookEntry {
  price: number;
  quantity: number;
}

interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdateId: number;
}

interface BinanceWSStore {
  orderBook: OrderBook;
  isConnected: boolean;
  error: string | null;
  connect: (symbol: string) => void;
  disconnect: () => void;
}

const useBinanceWS = create<BinanceWSStore>((set, get) => ({
  orderBook: {
    bids: [],
    asks: [],
    lastUpdateId: 0
  },
  isConnected: false,
  error: null,
  connect: (symbol: string) => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`);

    ws.onopen = () => {
      set({ isConnected: true, error: null });
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Process orderbook data
      const bids = data.b.map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity)
      }));

      const asks = data.a.map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity)
      }));

      set({
        orderBook: {
          bids: bids.sort((a: OrderBookEntry, b: OrderBookEntry) => b.price - a.price), // Sort bids in descending order
          asks: asks.sort((a: OrderBookEntry, b: OrderBookEntry) => a.price - b.price), // Sort asks in ascending order
          lastUpdateId: data.u
        }
      });
    };

    ws.onerror = (error) => {
      set({ error: 'WebSocket error occurred', isConnected: false });
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      set({ isConnected: false });
      console.log('WebSocket disconnected');
    };

    // Store the WebSocket instance
    (get() as any).ws = ws;
  },
  disconnect: () => {
    const ws = (get() as any).ws;
    if (ws) {
      ws.close();
      set({ isConnected: false, orderBook: { bids: [], asks: [], lastUpdateId: 0 } });
    }
  }
}));

export default useBinanceWS; 