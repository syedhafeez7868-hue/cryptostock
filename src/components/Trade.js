import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Trade.css";

export default function Trade() {
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchCoins();
    const savedHistory = JSON.parse(localStorage.getItem("tradeHistory")) || [];
    setTradeHistory(savedHistory);
  }, []);

  const fetchCoins = async () => {
    try {
      const res = await axios.get(
             "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h"
           );

      setCoins(res.data);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (error) {
      console.error("Error fetching coins:", error);
    }
  };

  const handleTrade = () => {
    if (!selectedCoin || quantity <= 0)
      return alert("Select a coin and enter quantity.");

    const coin = coins.find((c) => c.id === selectedCoin);
    const newTrade = {
      id: Date.now(),
      coin: coin.name,
      symbol: coin.symbol,
      price: coin.current_price,
      quantity,
      total: (coin.current_price * quantity).toFixed(2),
      status: "Completed",
      date: new Date().toLocaleString(),
    };

    const updatedHistory = [newTrade, ...tradeHistory];
    setTradeHistory(updatedHistory);
    localStorage.setItem("tradeHistory", JSON.stringify(updatedHistory));
    alert("✅ Trade executed successfully!");
    setQuantity(0);
  };

  return (
    <div className="trade-content">
      <h2>💱 Trade</h2>
      <p>Buy or Sell Crypto (mock execution + live prices)</p>

      <div className="cards-container">
        <div className="summary-card">
          <h3>Total Trades</h3>
          <p>{tradeHistory.length}</p>
        </div>
        <div className="summary-card">
          <h3>Available Coins</h3>
          <p>{coins.length}</p>
        </div>
      </div>

      {lastUpdated && (
        <p className="last-updated">
          ⏱️ Last Updated: <span>{lastUpdated}</span>
        </p>
      )}

      <div className="trade-summary">
        <div className="trade-card">
          <h3>Select Coin</h3>
          <select
            onChange={(e) => setSelectedCoin(e.target.value)}
            value={selectedCoin}
            style={{
              background: "#243238",
              color: "white",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #2a3b40",
              width: "100%",
            }}
          >
            <option value="">-- Select Coin --</option>
            {coins.map((coin) => (
              <option key={coin.id} value={coin.id}>
                {coin.name}
              </option>
            ))}
          </select>
        </div>

        <div className="trade-card">
          <h3>Enter Quantity</h3>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 2"
            style={{
              background: "#243238",
              color: "white",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #2a3b40",
              width: "100%",
            }}
          />
        </div>

        <div className="trade-card">
          <h3>Action</h3>
          <button
            onClick={handleTrade}
            className="settings-btn"
            style={{ padding: "10px 20px" }}
          >
            Execute Trade
          </button>
        </div>
      </div>

      <div className="trade-table-section">
        <h3>Trade History</h3>
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
            {tradeHistory.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.coin}</td>
                <td>{t.quantity}</td>
                <td>${t.price}</td>
                <td>${t.total}</td>
                <td className="green">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
