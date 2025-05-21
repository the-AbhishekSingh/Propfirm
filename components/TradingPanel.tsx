import React, { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabase';
import useBinanceWS from '@/lib/binance-ws';

interface TradingPanelProps {
  symbol: string;
}

interface OrderBookEntry {
  price: number;
  quantity: number;
}

const TradingPanel: React.FC<TradingPanelProps> = ({ symbol }) => {
  const user = useUser();
  const { orderBook, isConnected, error, connect, disconnect } = useBinanceWS();
  const [amount, setAmount] = useState<string>('');
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG');
  const [orderSummary, setOrderSummary] = useState<{
    total: number;
    price: number;
  } | null>(null);

  useEffect(() => {
    connect(symbol);
    return () => disconnect();
  }, [symbol]);

  useEffect(() => {
    if (amount && orderBook.asks.length > 0) {
      const price = positionType === 'LONG' ? orderBook.asks[0].price : orderBook.bids[0].price;
      const total = parseFloat(amount) * price;
      setOrderSummary({ total, price });
    } else {
      setOrderSummary(null);
    }
  }, [amount, positionType, orderBook]);

  const handleOrder = async () => {
    if (!user || !amount || !orderSummary) return;

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          market: symbol,
          position_type: positionType,
          amount: parseFloat(amount),
          entry_price: orderSummary.price,
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw error;

      // Here you would typically integrate with Binance API to place the actual order
      console.log('Order placed:', order);
      
      // Reset form
      setAmount('');
      setOrderSummary(null);
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 rounded-lg">
      {/* Orderbook Display */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-green-500 font-bold mb-2">Bids</h3>
          <div className="space-y-1">
            {orderBook.bids.slice(0, 10).map((bid: OrderBookEntry, index: number) => (
              <div key={index} className="flex justify-between text-green-500">
                <span>{bid.price.toFixed(2)}</span>
                <span>{bid.quantity.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-red-500 font-bold mb-2">Asks</h3>
          <div className="space-y-1">
            {orderBook.asks.slice(0, 10).map((ask: OrderBookEntry, index: number) => (
              <div key={index} className="flex justify-between text-red-500">
                <span>{ask.price.toFixed(2)}</span>
                <span>{ask.quantity.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Form */}
      <div className="mt-4">
        <div className="flex gap-2 mb-4">
          <button
            className={`flex-1 py-2 rounded ${
              positionType === 'LONG' ? 'bg-green-500' : 'bg-gray-600'
            }`}
            onClick={() => setPositionType('LONG')}
          >
            Buy
          </button>
          <button
            className={`flex-1 py-2 rounded ${
              positionType === 'SHORT' ? 'bg-red-500' : 'bg-gray-600'
            }`}
            onClick={() => setPositionType('SHORT')}
          >
            Sell
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 rounded bg-gray-700"
            placeholder="Enter amount"
          />
        </div>

        {orderSummary && (
          <div className="mb-4 p-3 bg-gray-700 rounded">
            <h4 className="font-bold mb-2">Order Summary</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Price:</span>
                <span>${orderSummary.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span>${orderSummary.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleOrder}
          disabled={!amount || !orderSummary}
          className="w-full py-2 rounded bg-blue-500 disabled:bg-gray-600"
        >
          Place Order
        </button>
      </div>

      {error && (
        <div className="mt-4 p-2 bg-red-500 rounded text-white">
          {error}
        </div>
      )}
    </div>
  );
};

export default TradingPanel; 