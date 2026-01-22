import axios from "axios";

// Cache structure: { key: { data: [...], expiry: timestamp } }
const marketCache = {};
const CACHE_DURATION = 60 * 1000; // 1 minute cache

export const getMarketHistory = async (req, res) => {
  try {
    const { symbol = 'BTC', interval = '1d' } = req.params;
    
    // Map frontend intervals to Binance intervals if needed
    // Frontend: 1H, 1D, 1W. Binance: 1h, 1d, 1w.
    const binanceInterval = interval.toLowerCase();
    const binanceSymbol = `${symbol.toUpperCase()}USDT`;

    const cacheKey = `${binanceSymbol}_${binanceInterval}`;
    
    // Check Cache
    if (marketCache[cacheKey] && marketCache[cacheKey].expiry > Date.now()) {
        return res.json({ success: true, data: marketCache[cacheKey].data });
    }

    // Fetch from Binance
    // Limit 50 candles is usually enough for a sparkline or simple chart
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
        params: {
            symbol: binanceSymbol,
            interval: binanceInterval,
            limit: 50
        }
    });

    // Transform Data
    // Binance returns [open_time, open, high, low, close, volume, ...]
    // We just need time and close price for a simple line chart
    const data = response.data.map(candle => ({
        time: candle[0],
        value: parseFloat(candle[4])
    }));

    // Save to Cache
    marketCache[cacheKey] = {
        data: data,
        expiry: Date.now() + CACHE_DURATION
    };

    res.json({ success: true, data });

  } catch (error) {
    console.error("Market API Error:", error.message);
    // If external API fails, return empty array to prevent crash
    res.status(500).json({ success: false, data: [] });
  }
};
