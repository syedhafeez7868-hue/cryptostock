import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./Markets.css"; 

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoinDetails();
    // eslint-disable-next-line
  }, [id]);

  const fetchCoinDetails = async () => {
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}?localization=false&sparkline=true`
      );
      setCoin(res.data);
    } catch (err) {
      console.error("Error fetching coin details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="markets-content">Loading coin data...</div>;
  if (!coin) return <div className="markets-content">Coin not found.</div>;

  const marketData = coin.market_data;
  const prices =
    coin.market_data.sparkline_7d.price.map((price, i) => ({
      index: i,
      price,
    })) || [];

  return (
    <div className="markets-content">
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 15,
          background: "transparent",
          border: "1px solid #f8c400",
          color: "#f8c400",
          padding: "8px 16px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <img
          src={coin.image.large}
          alt={coin.name}
          width="60"
          height="60"
          style={{ borderRadius: "10px" }}
        />
        <div>
          <h2 style={{ color: "#f8c400" }}>
            {coin.name} ({coin.symbol.toUpperCase()})
          </h2>
          <p style={{ color: "#9fb0b3" }}>{coin.asset_platform_id || "Crypto"}</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginTop: "25px",
        }}
      >
        <div className="summary-card">
          <h3>Current Price</h3>
          <p>${marketData.current_price.usd.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>Market Cap</h3>
          <p>${marketData.market_cap.usd.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>24h Change</h3>
          <p
            style={{
              color:
                marketData.price_change_percentage_24h >= 0
                  ? "#10b981"
                  : "#ef4444",
            }}
          >
            {marketData.price_change_percentage_24h.toFixed(2)}%
          </p>
        </div>
        <div className="summary-card">
          <h3>Rank</h3>
          <p>#{coin.market_cap_rank}</p>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 30 }}>
        <h3>7-Day Price Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={prices}>
            <XAxis dataKey="index" hide />
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip
              contentStyle={{
                background: "#1c2a2f",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value) => [`$${value.toFixed(2)}`, "Price"]}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={
                marketData.price_change_percentage_24h >= 0
                  ? "#10b981"
                  : "#ef4444"
              }
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="transactions-card" style={{ marginTop: 30 }}>
        <h3>About {coin.name}</h3>
        <p
          style={{
            color: "#bfc9cc",
            fontSize: "14px",
            lineHeight: "1.6em",
          }}
          dangerouslySetInnerHTML={{
            __html:
              coin.description.en?.substring(0, 500) ||
              "No description available.",
          }}
        ></p>
      </div>

      <button
        className="trade-btn"
        style={{ marginTop: 25 }}
        onClick={() => navigate("/dashboard?tab=trade")}
      >
        Buy / Trade {coin.symbol.toUpperCase()}
      </button>
    </div>
  );
}
