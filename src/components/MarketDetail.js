// src/components/MarketDetail.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { backend } from "./api";
import "./Markets.css";

function getUserEmail() {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    return u?.email || "guest@example.com";
  } catch {
    return "guest@example.com";
  }
}

export default function MarketDetail() {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [qty, setQty] = useState("");
  const [mode, setMode] = useState(null);
  const userEmail = getUserEmail();

  useEffect(() => {
    fetchCoin();
  }, [id]);

  const fetchCoin = async () => {
    try {
      const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&sparkline=true`);
      setCoin(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const doTrade = async (type) => {
    if (!qty || Number(qty) <= 0) return alert("enter qty");
    const price = coin?.market_data?.current_price?.usd;
    const total = price * Number(qty);

    const tradePayload = {
      email: userEmail,
      coinId: coin.id,
      coinName: coin.name,
      type,
      quantity: Number(qty),
      price,
      total,
      status: "Completed",
      date: new Date().toLocaleString(),
    };

    try {
      await backend.post("/trades", tradePayload);
      await backend.post("/portfolio/update", tradePayload);

      const walletRes = await backend.get(`/wallet/${userEmail}`);
      let balance = walletRes.data.balanceUsd || 0;
      if (type === "BUY") balance -= total; else balance += total;
      await backend.post("/wallet/update", { email: userEmail, balanceUsd: balance });

      alert("✅ Trade saved");
      setQty("");
      setMode(null);
    } catch (err) {
      console.error(err);
      alert("trade failed");
    }
  };

  if (!coin) return <div className="markets-content">Loading...</div>;

  const prices = (coin.market_data?.sparkline_7d?.price || []).map((p, i) => ({ i, price: p }));

  return (
    <div className="markets-content">
      <button onClick={() => window.history.back()} className="close-settings-btn">← Back</button>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <img src={coin.image?.large} alt={coin.name} width="60" height="60" />
        <div>
          <h2 style={{ color: "#f8c400" }}>{coin.name} ({coin.symbol?.toUpperCase()})</h2>
          <p style={{ color: "#9fb0b3" }}>{coin.market_data?.current_price?.usd ? `$${coin.market_data.current_price.usd.toLocaleString()}` : ""}</p>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 20 }}>
        <h3>7-Day Price</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={prices}>
            <Line type="monotone" dataKey="price" stroke={coin.market_data?.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444"} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="settings-btn" onClick={() => setMode('BUY')}>Buy</button>
        <button className="logout-btn" onClick={() => setMode('SELL')}>Sell</button>
      </div>

      {mode && (
        <div style={{ marginTop: 12 }}>
          <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantity" />
          <button onClick={() => doTrade(mode)} className="settings-btn">Confirm {mode}</button>
          <button onClick={() => { setMode(null); setQty(''); }} className="close-settings-btn">Cancel</button>
        </div>
      )}

      <div className="transactions-card" style={{ marginTop: 20 }}>
        <h3>About</h3>
        <div dangerouslySetInnerHTML={{ __html: coin.description?.en?.substring(0, 500) || "No description" }} />
      </div>
    </div>
  );
}
