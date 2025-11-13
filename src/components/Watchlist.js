// src/components/Watchlist.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { backend } from "./api";
import { getUserEmail } from "./utils";
import "./Watchlist.css";

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const userEmail = getUserEmail();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const res = await backend.get(`/watchlist/${userEmail}`);
      setWatchlist(res.data || []);
    } catch (err) {
      console.error("Error fetching watchlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (coinId) => {
    try {
      await backend.post("/watchlist/remove", { email: userEmail, coinId });
      setWatchlist((prev) => prev.filter((c) => c.coinId !== coinId));
    } catch (err) {
      console.error("Error removing:", err);
    }
  };

  const clearAllWatchlist = async () => {
    if (!window.confirm("Are you sure you want to remove all watchlist items?")) return;
    try {
      await backend.post("/watchlist/clear", { email: userEmail });
      setWatchlist([]);
    } catch (err) {
      console.error("Error clearing all:", err);
    }
  };

  const goToMarketDetail = (coinId) => {
    navigate(`/market/${coinId}`);
  };

  if (loading) return <div className="watchlist-page">Loading your Watchlist...</div>;

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <h2 className="watchlist-title">⭐ Watchlist</h2>
        {watchlist.length > 0 && (
          <button className="clear-btn" onClick={clearAllWatchlist}>
            🗑️ Clear All
          </button>
        )}
      </div>

      {watchlist.length === 0 ? (
        <p className="watchlist-empty">No coins added yet. Go to Markets and add some!</p>
      ) : (
        <div className="watchlist-grid">
          {watchlist.map((item) => (
            <div key={item.coinId} className="watchlist-card">
              <div
                className="watchlist-info"
                onClick={() => goToMarketDetail(item.coinId)}
              >
                <img
                  src={`https://cryptoicons.org/api/icon/${item.coinId.toLowerCase()}/64`}
                  alt={item.coinName}
                  className="watchlist-icon"
                  onError={(e) =>
                    (e.target.src =
                      "https://cdn-icons-png.flaticon.com/512/2776/2776000.png")
                  }
                />
                <div>
                  <h4>{item.coinName}</h4>
                  <p className="symbol">{item.coinId.toUpperCase()}</p>
                </div>
              </div>
              <button
                className="remove-btn"
                onClick={() => removeFromWatchlist(item.coinId)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
