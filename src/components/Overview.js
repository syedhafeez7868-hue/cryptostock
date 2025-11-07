// src/components/Overview.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { COINGECKO_MARKETS_URL, backend } from "./api";
import "./Overview.css";

function getUserEmail() {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    return u?.email || "guest@example.com";
  } catch {
    return "guest@example.com";
  }
}

export default function Overview() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCoin, setExpandedCoin] = useState(null);
  const [tradeMode, setTradeMode] = useState(null);
  const [tradeQty, setTradeQty] = useState("");
   const [userEmail] = useState(getUserEmail());
  const [totalMarketCap, setTotalMarketCap] = useState(0);
  const [avg24hChange, setAvg24hChange] = useState(0);

  useEffect(() => {
    fetchCoins();
    // optionally refresh prices every 30s
    const iv = setInterval(fetchCoins, 30000);
    return () => clearInterval(iv);
  }, []);

  const fetchCoins = async () => {
    setLoading(true);
    try {
      const res = await axios.get(COINGECKO_MARKETS_URL);
      setCoins(res.data || []);
      const totalCap = (res.data || []).reduce((sum, c) => sum + (c.market_cap || 0), 0);
      const valid = (res.data || []).filter((c) => typeof c.price_change_percentage_24h === "number");
      const avg = valid.length ? valid.reduce((s, c) => s + c.price_change_percentage_24h, 0) / valid.length : 0;
      setTotalMarketCap(totalCap);
      setAvg24hChange(avg);
    } catch (err) {
      console.error("Error fetching coins:", err);
    } finally {
      setLoading(false);
    }
  };

  const openExpand = (coinId) => {
    setTradeMode(null);
    setTradeQty("");
    setExpandedCoin(coinId === expandedCoin ? null : coinId);
  };

  // unified trade handler: save trade, update portfolio, update wallet
  const handleTrade = async (coin, type) => {
    if (!tradeQty || Number(tradeQty) <= 0) return alert("Enter valid quantity");

    const price = coin.current_price;
    const total = price * Number(tradeQty);
    const tradePayload = {
      email: userEmail,
      coinId: coin.id,
      coinName: coin.name,
      type,
      quantity: Number(tradeQty),
      price,
      total,
      status: "Completed",
      date: new Date().toLocaleString(),
    };

    try {
      await backend.post("/trades", tradePayload);
      // update portfolio
      await backend.post("/portfolio/update", tradePayload);
      // update wallet
      const walletRes = await backend.get(`/wallet/${userEmail}`);
      let balance = walletRes.data.balanceUsd || 0;
      if (type === "BUY") balance -= total;
      else balance += total;
      await backend.post("/wallet/update", { email: userEmail, balanceUsd: balance });

      alert("✅ Trade completed successfully!");
      // optionally notify other components (they fetch on mount / interval)
    } catch (err) {
      console.error("Trade error:", err);
      alert("❌ Trade or wallet update failed");
    } finally {
      setTradeMode(null);
      setTradeQty("");
    }
  };

  return (
    <div className="overview-content">
      <h2>📊 Market Overview</h2>
      <p className="muted">Live data of top 20 cryptocurrencies (7-day trend)</p>

      {/* MOVING COIN TICKER */}
      {!loading && coins.length > 0 && (
        <div className="coin-ticker">
          <div className="ticker-track">
            {coins.slice(0, 15).map((c) => (
              <div key={c.id} className={`ticker-item ${c.price_change_percentage_24h >= 0 ? "green" : "red"}`}>
                <img src={c.image} alt={c.symbol} width="22" height="22" />
                <span className="ticker-name">{c.symbol.toUpperCase()}</span>
                <span className="ticker-price">${c.current_price.toLocaleString()}</span>
              </div>
            ))}
            {coins.slice(0, 15).map((c) => (
              <div key={c.id + "-copy"} className={`ticker-item ${c.price_change_percentage_24h >= 0 ? "green" : "red"}`}>
                <img src={c.image} alt={c.symbol} width="22" height="22" />
                <span className="ticker-name">{c.symbol.toUpperCase()}</span>
                <span className="ticker-price">${c.current_price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cards-container">
        <div className="summary-card">
          <h3>Total Market Cap</h3>
          <p>${(totalMarketCap / 1e12).toFixed(2)}T</p>
        </div>
        <div className="summary-card">
          <h3>24h Avg Change</h3>
          <p style={{ color: avg24hChange >= 0 ? "#10b981" : "#ef4444" }}>{avg24hChange.toFixed(2)}%</p>
        </div>
        <div className="summary-card">
          <h3>Total Coins</h3>
          <p>{coins.length}</p>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Top 10 Coins — Click to Expand</h3>
          {loading ? (
            <p>Loading live data...</p>
          ) : (
            <div className="coin-grid">
              {coins.slice(0, 10).map((c) => (
                <div key={c.id} className={`coin-card ${expandedCoin === c.id ? "expanded" : ""}`}>
                  <div className="coin-header">
                    <div className="coin-info">
                      <img src={c.image} alt={c.symbol} width="28" height="28" />
                      <div>
                        <div className="coin-name">{c.name} ({c.symbol.toUpperCase()})</div>
                        <div className="coin-price">${c.current_price.toLocaleString()}</div>
                      </div>
                    </div>
                    <button className="settings-btn" onClick={() => openExpand(c.id)}>
                      {expandedCoin === c.id ? "Close" : "Open"}
                    </button>
                  </div>

                  {expandedCoin === c.id && (
                    <div className="expanded-section">
                      <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={(c.sparkline_in_7d?.price || []).map((p, i) => ({ day: `Day ${i + 1}`, price: p }))}
                            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a3b40" />
                            <XAxis dataKey="day" tick={{ fill: "#ccc", fontSize: 10 }} interval={Math.floor((c.sparkline_in_7d?.price?.length || 1) / 7)} />
                            <YAxis tick={{ fill: "#ccc", fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                            <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, "Price"]} contentStyle={{ backgroundColor: "#1c2a2f", border: "1px solid #2a3b40", borderRadius: "8px" }} />
                            <Bar dataKey="price" fill={c.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444"} barSize={6} radius={[3, 3, 0, 0]} animationDuration={1000} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="trade-btns">
                        <button className="settings-btn" onClick={() => setTradeMode("BUY")}>Buy</button>
                        <button className="logout-btn" onClick={() => setTradeMode("SELL")}>Sell</button>
                      </div>

                      {tradeMode && (
                        <div className="trade-box">
                          <input type="number" placeholder="Quantity" value={tradeQty} onChange={(e) => setTradeQty(e.target.value)} />
                          <button className="settings-btn" onClick={() => handleTrade(c, tradeMode)}>OK</button>
                          <button className="close-settings-btn" onClick={() => setTradeMode(null)}>Cancel</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
