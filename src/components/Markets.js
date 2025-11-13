import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import "./Markets.css";
import { COINGECKO_MARKETS_URL, backend } from "./api";
import { getUserEmail } from "./utils";

export default function Markets() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const userEmail = getUserEmail();

  useEffect(() => {
    fetchMarketData();
    const iv = setInterval(fetchMarketData, 30000);
    return () => clearInterval(iv);
  }, []);

  const fetchMarketData = async () => {
    try {
      const res = await axios.get(COINGECKO_MARKETS_URL);
      setCoins(res.data || []);
    } catch (err) {
      console.error("Error fetching markets:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (coin, e) => {
    e.stopPropagation();
    if (!userEmail) return alert("Please log in first");
    try {
      const body = { email: userEmail, coinId: coin.id, coinName: coin.name, symbol: coin.symbol.toUpperCase() };
      const res = await backend.post("/watchlist/add", body);
      alert(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to add to watchlist");
    }
  };

  const filtered = coins.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.symbol.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="markets-content">
      <div className="markets-header"><h2>💹 Markets</h2><p>Live Top 20 Cryptocurrencies (CoinGecko)</p></div>
      <input type="text" placeholder="Search by name or symbol..." value={query} onChange={(e)=>setQuery(e.target.value)} style={{ width: "260px", padding:"10px 12px", borderRadius:"8px", border:"1px solid #263238", background:"#1c2a2f", color:"#fff", marginBottom:"15px"}} />

      {loading ? <p>Loading market data...</p> : (
        <div className="markets-table-card">
          <div className="markets-table-head">
            <div>Coin</div><div>Price</div><div>24h %</div><div>Market Cap</div><div>24h Chart</div><div>Trade</div>
          </div>
          <div className="markets-table-body">
            {filtered.map(coin => (
              <div key={coin.id} className="markets-row" onClick={() => navigate(`/market/${coin.id}`)} style={{ cursor: "pointer" }}>
                <div className="coin-col">
                  <div className="coin-icon"><img src={coin.image} alt={coin.id} width="30" height="30" style={{ borderRadius: "6px" }} /></div>
                  <div className="coin-meta"><div className="coin-name">{coin.name}</div><div className="coin-symbol">{coin.symbol.toUpperCase()}</div></div>
                </div>

                <div className="price-col">${coin.current_price?.toLocaleString()}</div>

                <div className={`change-col ${coin.price_change_percentage_24h >= 0 ? "green" : "red"}`}>{coin.price_change_percentage_24h?.toFixed(2)}%</div>

                <div className="mcap-col">${coin.market_cap?.toLocaleString()}</div>

                <div className="spark-col">
                  <ResponsiveContainer width="100%" height={40}>
                    <LineChart data={(coin.sparkline_in_7d?.price || []).map((p,i)=>({index:i, price:p}))}>
                      <Line type="monotone" dataKey="price" stroke={coin.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444"} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="action-col">
                  <button className="trade-btn" onClick={(e)=>{ e.stopPropagation(); navigate(`/market/${coin.id}`); }}>Trade</button>
                  <button className="settings-btn" title="Add to Watchlist" onClick={(e)=>addToWatchlist(coin,e)} style={{ marginLeft: 8 }}>☆</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
