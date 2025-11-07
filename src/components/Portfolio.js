// src/components/Portfolio.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { backend } from "./api";
import "./Portfolio.css";

function getUserEmail() {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    return u?.email || "guest@example.com";
  } catch {
    return "guest@example.com";
  }
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userEmail = getUserEmail();

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await backend.get(`/portfolio/${userEmail}`);
      const holdingsMap = res.data || {};

      const coinsRes = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1"
      );

      const portfolioData = (coinsRes.data || [])
        .map((coin) => {
          // find matching key in holdingsMap robustly (case / partial)
          const matchKey = Object.keys(holdingsMap).find((k) =>
            k.toLowerCase() === coin.name.toLowerCase() || coin.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(coin.name.toLowerCase())
          );
          const qty = matchKey ? Number(holdingsMap[matchKey]) : 0;
          return {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            image: coin.image,
            current_price: coin.current_price,
            holdings: qty || 0,
          };
        })
        .filter(c => c.holdings > 0);

      setHoldings(portfolioData);
    } catch (err) {
      console.error("Error fetching portfolio:", err.response?.data || err.message);
      setError(`Failed to load portfolio data.`);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.holdings * h.current_price, 0);
  const COLORS = ["#f8c400", "#10b981", "#ef4444", "#3b82f6", "#a855f7"];

  return (
    <div className="portfolio-content">
      <h2>📁 Portfolio</h2>
      <p>Live holdings fetched from database (auto-updated on trades)</p>

      {loading ? (
        <p className="loading-text">Loading portfolio...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : holdings.length === 0 ? (
        <p className="loading-text">No holdings yet. Start trading to build your portfolio.</p>
      ) : (
        <>
          <div className="portfolio-chart-section">
            <div className="chart-container">
              <h3>Holdings Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={holdings}
                    dataKey={(h) => h.holdings * h.current_price}
                    nameKey="name"
                    outerRadius={100}
                    fill="#8884d8"
                  >
                    {holdings.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p>Total Value: ${totalValue.toFixed(2)}</p>
            </div>

            <div className="holdings-summary">
              <h3>Holdings Summary</h3>
              <ul>
                {holdings.map((coin) => (
                  <li key={coin.id} className="holding-item">
                    <span className="coin-name">
                      <img src={coin.image} alt={coin.name} width="22" style={{ marginRight: "8px", verticalAlign: "middle" }} />
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </span>
                    <span className="coin-value">${(coin.holdings * coin.current_price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
