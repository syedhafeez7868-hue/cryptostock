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

// X-axis formatting
function formatLabel(ts, range) {
  const d = new Date(ts);
  if (range === "1M") return d.toLocaleDateString("en", { day: "2-digit", month: "short" });
  if (range === "6M" || range === "1Y") return d.toLocaleDateString("en", { month: "short" });
  return "";
}

// Group by month
function groupByMonth(data) {
  const map = {};
  data.forEach((p) => {
    const d = new Date(p.ts);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!map[key]) map[key] = [];
    map[key].push(p.price);
  });
  return Object.keys(map).map((key) => {
    const [y, m] = key.split("-").map(Number);
    const avg = map[key].reduce((a, b) => a + b, 0) / map[key].length;
    return { ts: new Date(y, m - 1, 1).getTime(), price: avg };
  });
}

export default function Overview() {
  const [coins, setCoins] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const [expandedCoin, setExpandedCoin] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState([]);

  const [tradeMode, setTradeMode] = useState(null);
  const [tradeQty, setTradeQty] = useState("");

  const [range, setRange] = useState("1M"); // ONLY 1M, 6M, 1Y

  const [userEmail] = useState(getUserEmail());
  const [totalMarketCap, setTotalMarketCap] = useState(0);
  const [avg24hChange, setAvg24hChange] = useState(0);

  useEffect(() => {
    fetchCoins();
    fetchWallet();
    const iv = setInterval(() => {
      fetchCoins();
      fetchWallet();
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  // Fetch coin list
  const fetchCoins = async () => {
    setLoading(true);
    try {
      const res = await axios.get(COINGECKO_MARKETS_URL);
      setCoins(res.data || []);

      const totalCap = res.data.reduce((s, c) => s + (c.market_cap || 0), 0);
      const avg =
        res.data.reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) /
        (res.data.length || 1);

      setTotalMarketCap(totalCap);
      setAvg24hChange(avg);
    } catch (err) {
      console.error("Error fetching coins:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet
  const fetchWallet = async () => {
    try {
      const res = await backend.get(`/wallet/${userEmail}`);
      setWallet(res.data);
    } catch (e) {}
  };

  // Expand card
  const openExpand = async (coinId) => {
    setTradeMode(null);
    setTradeQty("");
    const newExp = coinId === expandedCoin ? null : coinId;
    setExpandedCoin(newExp);

    if (!newExp) return setExpandedHistory([]);

    loadRangeData(newExp, range);
  };

  // Apply range
  const changeRange = (r) => {
    setRange(r);
    if (expandedCoin) loadRangeData(expandedCoin, r);
  };

  // Load graph data for range
  const loadRangeData = async (coinId, r) => {
    try {
      let days = 30;
      if (r === "6M") days = 180;
      if (r === "1Y") days = 365;

      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
        { params: { vs_currency: "usd", days, interval: "daily" } }
      );

      const raw = res.data.prices.map((p) => ({
        ts: p[0],
        price: p[1],
      }));

      let final = raw;
      if (r === "6M") final = groupByMonth(raw).slice(-6);
      if (r === "1Y") final = groupByMonth(raw).slice(-12);

      setExpandedHistory(final);
    } catch (err) {
      console.error("Error loading history:", err);
      setExpandedHistory([]);
    }
  };

  // Trading
  const handleTrade = async (coin, type) => {
    if (!tradeQty || Number(tradeQty) <= 0) return alert("Enter valid quantity");

    const walletRes = await backend.get(`/wallet/${userEmail}`);
    const w = walletRes.data;

    const price = coin.current_price;
    const total = price * Number(tradeQty);

    if (type === "BUY" && w.balanceUsd < total)
      return alert("Insufficient funds!");

    const payload = {
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

    await backend.post("/trades", payload);
    await backend.post("/portfolio/update", payload);

    await backend.post("/wallet/update", {
      email: userEmail,
      balanceUsd:
        type === "BUY" ? w.balanceUsd - total : w.balanceUsd + total,
    });

    alert("Trade successful!");
    setTradeMode(null);
    setTradeQty("");
    fetchWallet();
  };

  return (
    <div className="overview-content">
      <h2>📊 Market Overview</h2>
      <p className="muted">Top 20 Cryptocurrencies</p>

      {/* TICKER */}
      {!loading && coins.length > 0 && (
        <div className="coin-ticker">
          <div className="ticker-track">
            {coins.slice(0, 12).map((c) => (
              <div
                key={c.id}
                className={`ticker-item ${
                  c.price_change_percentage_24h >= 0 ? "green" : "red"
                }`}
              >
                <img src={c.image} width="22" height="22" />
                <span>{c.symbol.toUpperCase()}</span>
                <span>${c.current_price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="cards-container">
        <div className="summary-card">
          <h3>Total Market Cap</h3>
          <p>${(totalMarketCap / 1e12).toFixed(2)}T</p>
        </div>
        <div className="summary-card">
          <h3>24h Avg Change</h3>
          <p style={{ color: avg24hChange >= 0 ? "#10b981" : "#ef4444" }}>
            {avg24hChange.toFixed(2)}%
          </p>
        </div>
        <div className="summary-card">
          <h3>Total Coins</h3>
          <p>{coins.length}</p>
        </div>
        <div className="summary-card">
          <h3>Wallet Balance</h3>
          <p>${wallet?.balanceUsd?.toFixed(2) ?? "0.00"}</p>
        </div>
      </div>

      {/* COIN LIST */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Top 10 Coins</h3>

          <div className="coin-grid">
            {coins.slice(0, 10).map((c) => (
              <div
                key={c.id}
                className={`coin-card ${expandedCoin === c.id ? "expanded" : ""}`}
              >
                <div className="coin-header">
                  <div className="coin-info">
                    <img src={c.image} width="28" height="28" />
                    <div>
                      <div>{c.name}</div>
                      <div>${c.current_price.toLocaleString()}</div>
                    </div>
                  </div>

                  <button
                    className="settings-btn"
                    onClick={() => openExpand(c.id)}
                  >
                    {expandedCoin === c.id ? "Close" : "Open"}
                  </button>
                </div>

                {expandedCoin === c.id && (
                  <div className="expanded-section">
                    {/* RANGE TABS */}
                    <div className="range-tabs">
                      {["1M", "6M", "1Y"].map((r) => (
                        <button
                          key={r}
                          onClick={() => changeRange(r)}
                          className={range === r ? "active-range" : ""}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    {/* GRAPH */}
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={expandedHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a3b40" />
                          <XAxis
                            dataKey="ts"
                            tickFormatter={(v) => formatLabel(v, range)}
                            tick={{ fill: "#ccc", fontSize: 10 }}
                          />
                          <YAxis
                            tick={{ fill: "#ccc", fontSize: 11 }}
                            tickFormatter={(v) => `$${v.toFixed(0)}`}
                          />

                          <Tooltip
                            formatter={(v) => [`$${v.toFixed(2)}`, "Price"]}
                            labelFormatter={(ts) =>
                              new Date(ts).toLocaleDateString()
                            }
                            contentStyle={{
                              backgroundColor: "#1c2a2f",
                              border: "1px solid #2a3b40",
                            }}
                          />

                          <Bar
                            dataKey="price"
                            fill={c.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444"}
                            barSize={8}
                            radius={[3, 3, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* BUY & SELL */}
                    <div className="trade-btns">
                      <button
                        className="settings-btn"
                        onClick={() => setTradeMode("BUY")}
                      >
                        Buy
                      </button>
                      <button
                        className="logout-btn"
                        onClick={() => setTradeMode("SELL")}
                      >
                        Sell
                      </button>
                    </div>

                    {tradeMode && (
                      <div className="trade-box">
                        <input
                          type="number"
                          value={tradeQty}
                          placeholder="Quantity"
                          onChange={(e) => setTradeQty(e.target.value)}
                        />
                        <button
                          className="settings-btn"
                          onClick={() => handleTrade(c, tradeMode)}
                        >
                          OK
                        </button>
                        <button
                          className="close-settings-btn"
                          onClick={() => setTradeMode(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
