// src/components/History.js
import React, { useEffect, useState } from "react";
import { backend } from "./api";
import "./History.css";

function getUserEmail() {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    return u?.email || "guest@example.com";
  } catch {
    return "guest@example.com";
  }
}

export default function History() {
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const userEmail = getUserEmail();

  useEffect(() => {
    fetchTrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const res = await backend.get(`/trades/${userEmail}`);
      setTrades(res.data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = filter === "All" ? trades : trades.filter((t) => t.status === filter);

  return (
    <div className="history-content">
      <h2>📜 Trade History</h2>
      <p>All your completed and live trade records</p>

      <div className="filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
        <button onClick={() => setFilter("All")}>Reset</button>
      </div>

      {loading ? (<p>Loading history...</p>) :
        (<div className="history-table">
          <table>
            <thead><tr><th>Date</th><th>Coin</th><th>Qty</th><th>Type</th><th>Price</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {filteredTrades.length === 0 ? (<tr><td colSpan="7">No trades found.</td></tr>) :
                filteredTrades.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.coinName}</td>
                    <td>{t.quantity}</td>
                    <td>{t.type}</td>
                    <td>${(t.price || 0).toFixed(2)}</td>
                    <td>${(t.total || 0).toFixed(2)}</td>
                    <td style={{ color: t.status === "Completed" ? "#10b981" : t.status === "Pending" ? "#f8c400" : "#ef4444", fontWeight: "bold" }}>{t.status}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>)
      }
    </div>
  );
}
