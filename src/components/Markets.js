// src/components/Markets.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import "./Markets.css";

export default function Markets() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  

  useEffect(() => {
    fetchMarketData();
    const iv = setInterval(fetchMarketData, 30000);
    return () => clearInterval(iv);
  }, []);

  const fetchMarketData = async () => {
    try {
      const res = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h"
      );
      setCoins(res.data || []);
    } catch (error) {
      console.error("Error fetching markets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoins = coins.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.symbol.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="markets-content">
      <div className="markets-header">
        <h2>💹 Markets</h2>
        <p>Live Top 20 Cryptocurrencies (CoinGecko)</p>
      </div>

      <input
        type="text"
        placeholder="Search by name or symbol..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "260px",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #263238",
          background: "#1c2a2f",
          color: "#fff",
          marginBottom: "15px",
        }}
      />

      {loading ? (
        <p>Loading market data...</p>
      ) : (
        <div className="markets-table-card">
          <div className="markets-table-head">
            <div>Coin</div>
            <div>Price</div>
            <div>24h %</div>
            <div>Market Cap</div>
            <div>24h Chart</div>
            <div>Trade</div>
          </div>

          <div className="markets-table-body">
            {filteredCoins.map((coin) => (
              <div
                key={coin.id}
                className="markets-row"
                onClick={() => navigate(`/market/${coin.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="coin-col">
                  <div className="coin-icon">
                    <img src={coin.image} alt={coin.id} width="30" height="30" style={{ borderRadius: "6px" }} />
                  </div>
                  <div className="coin-meta">
                    <div className="coin-name">{coin.name}</div>
                    <div className="coin-symbol">{coin.symbol.toUpperCase()}</div>
                  </div>
                </div>

                <div className="price-col">${coin.current_price?.toLocaleString()}</div>

                <div className={`change-col ${coin.price_change_percentage_24h >= 0 ? "green" : "red"}`}>
                  {coin.price_change_percentage_24h?.toFixed(2)}%
                </div>

                <div className="mcap-col">${coin.market_cap?.toLocaleString()}</div>

                <div className="spark-col">
                  <ResponsiveContainer width="100%" height={40}>
                    <LineChart data={(coin.sparkline_in_7d?.price || []).map((p, i) => ({ index: i, price: p }))}>
                      <Line type="monotone" dataKey="price" stroke={coin.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444"} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="action-col">
                  <button className="trade-btn">Trade</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
