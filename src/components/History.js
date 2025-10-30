import React, { useEffect, useState } from "react";
import "./History.css";

export default function History() {
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("tradeHistory")) || [];
    setTrades(data);
  }, []);

  const filteredTrades =
    filter === "All"
      ? trades
      : trades.filter((t) => t.status === filter);

  return (
    <div className="history-content">
      <h2>📜 Trade History</h2>
      <p>Complete record of your trades</p>

      <div className="filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
        <button onClick={() => setFilter("All")}>Reset</button>
      </div>

      <div className="history-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Coin</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan="6">No records found.</td>
              </tr>
            ) : (
              filteredTrades.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.coin}</td>
                  <td>{t.quantity}</td>
                  <td>${t.price}</td>
                  <td>${t.total}</td>
                  <td>
                    <span className={`status-badge green-bg`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
