// src/components/Overview.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import "./Overview.css"; 

export default function Overview() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      const res = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h"
      );
      setCoins(res.data);
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalMarketCap = coins.reduce((sum, c) => sum + c.market_cap, 0);
  const avg24hChange =
    coins.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) /
    (coins.length || 1);

  return (
    <div className="overview-content">
      <h2 style={{ color: "#f8c400" }}>📊 Market Overview</h2>
      <p style={{ color: "#9fb0b3" }}>Live data of top 20 cryptocurrencies</p>

      {/* Summary Cards */}
      <div className="cards-container">
        <div className="summary-card">
          <h3>Total Market Cap</h3>
          <p>${(totalMarketCap / 1e12).toFixed(2)} Trillion</p>
        </div>
        <div className="summary-card">
          <h3>24h Avg Change</h3>
          <p
            style={{
              color: avg24hChange >= 0 ? "#10b981" : "#ef4444",
              fontWeight: "bold",
            }}
          >
            {avg24hChange.toFixed(2)}%
          </p>
        </div>
        <div className="summary-card">
          <h3>Total Coins</h3>
          <p>{coins.length}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Top 10 Coins — 24h Trend</h3>
          {loading ? (
            <p>Loading chart...</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              {coins.slice(0, 10).map((coin) => (
                <div key={coin.id} style={{ background: "#0f181b", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img src={coin.image} alt={coin.id} width="26" height="26" />
                    <div style={{ fontWeight: 600 }}>
                      {coin.name} <span style={{ color: "#9fb0b3" }}>({coin.symbol.toUpperCase()})</span>
                    </div>
                  </div>
                  <div style={{ height: 50, marginTop: 6 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={coin.sparkline_in_7d.price.map((y, i) => ({
                          index: i,
                          price: y,
                        }))}
                      >
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={coin.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="transactions-card">
        <h3>Top 10 Coins by Market Cap</h3>
        {loading ? (
          <p>Loading table...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Coin</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {coins.slice(0, 10).map((coin, i) => (
                <tr key={coin.id}>
                  <td>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={coin.image} alt={coin.symbol} width="22" height="22" />
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </div>
                  </td>
                  <td>${coin.current_price.toLocaleString()}</td>
                  <td
                    style={{
                      color: coin.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {coin.price_change_percentage_24h?.toFixed(2)}%
                  </td>
                  <td>${coin.market_cap.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
