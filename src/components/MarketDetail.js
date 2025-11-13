// src/components/MarketDetail.js
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { backend } from "./api";
import "./Markets.css";
import { getUserEmail } from "./utils";

// -------------------- X-Axis LABEL FORMATTER --------------------
function formatLabel(ts, mode) {
  const d = new Date(ts);
  if (mode === "1M")
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  if (mode === "6M") return d.toLocaleDateString("en-US", { month: "short" });
  if (mode === "1Y") return d.toLocaleDateString("en-US", { month: "short" });
  return "";
}

// -------------------- GROUP BY MONTH --------------------
function groupByMonth(data) {
  const map = {};
  data.forEach((p) => {
    const d = new Date(p.ts);
    const k = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!map[k]) map[k] = [];
    map[k].push(p.price);
  });

  return Object.keys(map).map((k) => {
    const [y, m] = k.split("-").map(Number);
    const avg = map[k].reduce((a, b) => a + b, 0) / map[k].length;
    return { ts: new Date(y, m - 1, 1).getTime(), price: avg };
  });
}

export default function MarketDetail() {
  const { id } = useParams();
  const userEmail = getUserEmail();

  const [coin, setCoin] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [animatedPoints, setAnimatedPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  // trading UI state
  const [qty, setQty] = useState("");
  const [mode, setMode] = useState(null); // "BUY" or "SELL"
  const [tradeLoading, setTradeLoading] = useState(false);

  const pollingRef = useRef(null);

  // FINAL RANGES
  const [range, setRange] = useState("1M"); // ONLY 1M, 6M, 1Y

  // -------------------- INITIAL LOAD --------------------
  useEffect(() => {
    fetchCoin();
    fetchWallet();
    fetchRange(range);
    startPolling();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, range]);

  // -------------------- FETCH COIN --------------------
  const fetchCoin = async () => {
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}?localization=false`
      );
      setCoin(res.data);
    } catch (e) {
      console.log("fetchCoin error:", e);
    }
  };

  // -------------------- FETCH WALLET --------------------
  const fetchWallet = async () => {
    try {
      const res = await backend.get(`/wallet/${userEmail}`);
      setWallet(res.data);
    } catch (e) {
      console.log("fetchWallet error:", e);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- FETCH RANGE GRAPH --------------------
  const fetchRange = async (r) => {
    setHistoryData([]);

    let days = 30;
    if (r === "6M") days = 180;
    if (r === "1Y") days = 365;

    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart`,
        { params: { vs_currency: "usd", days, interval: "daily" } }
      );

      const raw = (res.data.prices || []).map((p) => ({
        ts: p[0],
        price: p[1],
      }));

      let final = raw;

      if (r === "6M") final = groupByMonth(raw).slice(-6);
      if (r === "1Y") final = groupByMonth(raw).slice(-12);

      setHistoryData(final);
      setAnimatedPoints([]);
    } catch (e) {
      console.log("fetchRange error:", e);
    }
  };

  // -------------------- LIVE POLLING --------------------
  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(pollLatestPrice, 6000);
    // initial poll
    pollLatestPrice();
  };

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  const pollLatestPrice = async () => {
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets`,
        { params: { vs_currency: "usd", ids: id } }
      );
      const price = res.data[0]?.current_price;
      if (price !== undefined) {
        setAnimatedPoints((prev) => [...prev.slice(-20), { ts: Date.now(), price }]);
      }
    } catch (e) {
      console.log("pollLatestPrice error:", e);
    }
  };

  // -------------------- TRADE (BUY / SELL) --------------------
  const confirmTrade = async (type) => {
    if (!qty || Number(qty) <= 0) {
      return alert("Enter a valid quantity");
    }
    if (!coin) return alert("Coin not loaded");

    const price =
      coin?.market_data?.current_price?.usd ||
      historyData[historyData.length - 1]?.price ||
      animatedPoints[animatedPoints.length - 1]?.price ||
      0;

    const quantity = Number(qty);
    const total = price * quantity;

    // BUY: check wallet balance
    if (type === "BUY") {
      const balance = Number(wallet?.balanceUsd || 0);
      if (balance < total) {
        return alert("Insufficient wallet balance for this buy");
      }
    }

    // SELL: optionally ensure user has holdings in portfolio (best-effort)
    // NOTE: your backend enforces portfolio correctness; this is a UI-level check if portfolio endpoint available.
    try {
      setTradeLoading(true);

      const payload = {
        email: userEmail,
        coinId: coin.id,
        coinName: coin.name,
        symbol: coin.symbol,
        type,
        quantity,
        price,
        total,
        status: "Completed",
        date: new Date().toLocaleString(),
      };

      // 1) create trade record
      await backend.post("/trades", payload);

      // 2) update portfolio (your backend endpoint used in other places)
      await backend.post("/portfolio/update", payload);

      // 3) update wallet balance
      const currentWalletRes = await backend.get(`/wallet/${userEmail}`);
      const currentWallet = currentWalletRes.data || { balanceUsd: 0 };
      let newBalance =
        type === "BUY"
          ? Number(currentWallet.balanceUsd || 0) - total
          : Number(currentWallet.balanceUsd || 0) + total;
      if (newBalance < 0) newBalance = 0;

      await backend.post("/wallet/update", {
        email: userEmail,
        balanceUsd: newBalance,
      });

      // 4) success feedback and refresh wallet & chart data
      alert(`✅ ${type} successful: ${quantity} ${coin.symbol?.toUpperCase()} @ $${price.toFixed(4)} (total $${total.toFixed(2)})`);
      setQty("");
      setMode(null);
      fetchWallet();
    } catch (err) {
      console.error("confirmTrade error:", err?.response?.data || err);
      alert("Trade failed. See console for details.");
    } finally {
      setTradeLoading(false);
    }
  };

  // -------------------- RENDER --------------------
  if (!coin) return <div className="markets-content">Loading...</div>;

  const chartData = [...historyData, ...animatedPoints];

  return (
    <div className="markets-content">
      <button
        onClick={() => window.history.back()}
        className="close-settings-btn"
      >
        ← Back
      </button>

      <h2 style={{ color: "#f8c400" }}>
        {coin.name} ({coin.symbol.toUpperCase()})
      </h2>

      {/* -------- RANGE BUTTONS (ONLY 1M, 6M, 1Y) -------- */}
      <div className="range-tabs">
        {["1M", "6M", "1Y"].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={range === r ? "active-range" : ""}
          >
            {r}
          </button>
        ))}
      </div>

      {/* ------------------ CHART ------------------ */}
      <div className="chart-card">
        <h3>{range} Chart</h3>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="ts"
              tickFormatter={(v) => formatLabel(v, range)}
              tick={{ fill: "#d5e1e3" }}
            />

            <YAxis
              tick={{ fill: "#d5e1e3" }}
              tickFormatter={(v) => `$${v.toLocaleString()}`}
            />

            <Tooltip
              formatter={(v) => `$${Number(v).toLocaleString()}`}
              labelFormatter={(ts) => new Date(ts).toLocaleString()}
            />

            <Line
              type="monotone"
              dataKey="price"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* --------- BUY / SELL BUTTONS & INPUT --------- */}
      <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <button
          className="settings-btn"
          onClick={() => {
            setMode("BUY");
            setQty("");
          }}
          style={{ minWidth: 90 }}
        >
          Buy
        </button>

        <button
          className="logout-btn"
          onClick={() => {
            setMode("SELL");
            setQty("");
          }}
          style={{ minWidth: 90 }}
        >
          Sell
        </button>

        {/* show inline quantity input when mode is active */}
        {mode && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
            <div style={{ fontWeight: 600 }}>{mode}</div>
            <input
              type="number"
              min="0"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Quantity"
              style={{ padding: "8px 10px", borderRadius: 6, background: "#0f1b1d", color: "#fff", border: "1px solid #263238", width: 140 }}
            />
            <button
              className="settings-btn"
              onClick={() => confirmTrade(mode)}
              disabled={tradeLoading}
            >
              {tradeLoading ? "Processing..." : "Confirm"}
            </button>
            <button
              className="close-settings-btn"
              onClick={() => {
                setMode(null);
                setQty("");
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
