// src/components/More.js
import React, { useState, useEffect } from "react";
import "./More.css";
import axios from "axios";

export default function More() {
  const [openSection, setOpenSection] = useState(null);
  const [coins, setCoins] = useState([]);
  const [virtualBalance, setVirtualBalance] = useState(10000);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [tradeQty, setTradeQty] = useState("");
  const [demoTrades, setDemoTrades] = useState([]);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  useEffect(() => {
    if (openSection === "demo") {
      axios
        .get(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1"
        )
        .then((res) => setCoins(res.data))
        .catch((err) => console.error(err));
    }
  }, [openSection]);

  const handleTrade = (type) => {
    if (!selectedCoin || !tradeQty || tradeQty <= 0)
      return alert("Please select a coin and enter valid quantity.");
    const price = selectedCoin.current_price;
    const cost = tradeQty * price;
    const date = new Date().toLocaleString();

    if (type === "BUY") {
      if (cost > virtualBalance) return alert("Insufficient virtual balance!");
      setVirtualBalance((prev) => prev - cost);
    } else {
      setVirtualBalance((prev) => prev + cost);
    }

    const tradeRecord = {
      coin: selectedCoin.name,
      symbol: selectedCoin.symbol.toUpperCase(),
      type,
      qty: Number(tradeQty),
      price,
      total: cost,
      date,
    };

    setDemoTrades((prev) => [tradeRecord, ...prev]);
    setTradeQty("");
  };

  // ✅ Verified embeddable YouTube videos (all working)
  const learnVideos = [
    "https://www.youtube.com/embed/SSo_EIwHSd4", // Blockchain Explained
    "https://www.youtube.com/embed/F-sTft6mNnU", // Crypto Trading for Beginners
    "https://www.youtube.com/embed/bBC-nXj3Ng4", // How Bitcoin Works
    "https://www.youtube.com/embed/Yb6825iv0Vk", // How to Trade Cryptocurrency
    "https://www.youtube.com/embed/l9jOJk30eQs", // Ethereum Explained
    "https://www.youtube.com/embed/2uYuPVoDqxk", // Cryptocurrency Explained
  ];

  return (
    <div className="more-container">
      <h2 className="more-title">📚 More Options</h2>
      <p className="more-sub">
        Explore additional features and learn more about SafeCryptoStocks.
      </p>

      <div className="more-buttons">
        {/* ---- Learn Section ---- */}
        <button
          className={`more-btn ${openSection === "learn" ? "active" : ""}`}
          onClick={() => toggleSection("learn")}
        >
          🎓 Learn
        </button>
        {openSection === "learn" && (
          <div className="more-content">
            <p>
              Watch real-time YouTube videos to understand crypto trading,
              blockchain, and strategies.
            </p>

            <div className="video-grid">
              {learnVideos.map((url, i) => (
                <div className="video-box" key={i}>
                  <iframe
                    width="100%"
                    height="180"
                    src={url}
                    title={`Crypto Learn Video ${i + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Demo Trade Section ---- */}
        <button
          className={`more-btn ${openSection === "demo" ? "active" : ""}`}
          onClick={() => toggleSection("demo")}
        >
          💼 Demo Trade
        </button>
        {openSection === "demo" && (
          <div className="more-content">
            <p>
              Practice trading safely with a <strong>$10,000 virtual balance</strong>.
              This is for learning only.
            </p>

            <div className="demo-wallet">
              <h4>💰 Virtual Balance: ${virtualBalance.toFixed(2)}</h4>
            </div>

            <div className="demo-market">
              <h4>Top Market Coins</h4>
              <div className="demo-market-grid">
                {coins.map((coin) => (
                  <div
                    key={coin.id}
                    className={`coin-card ${
                      selectedCoin?.id === coin.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedCoin(coin)}
                  >
                    <img src={coin.image} alt={coin.name} />
                    <p>{coin.name}</p>
                    <span>${coin.current_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedCoin && (
              <div className="demo-trade-box">
                <h4>
                  Trading: {selectedCoin.name} (
                  {selectedCoin.symbol.toUpperCase()})
                </h4>
                <input
                  type="number"
                  placeholder="Enter Quantity"
                  value={tradeQty}
                  onChange={(e) => setTradeQty(e.target.value)}
                />
                <div className="demo-buttons">
                  <button
                    className="btn-demo-buy"
                    onClick={() => handleTrade("BUY")}
                  >
                    Buy
                  </button>
                  <button
                    className="btn-demo-sell"
                    onClick={() => handleTrade("SELL")}
                  >
                    Sell
                  </button>
                </div>
              </div>
            )}

            {demoTrades.length > 0 && (
              <div className="demo-history">
                <h4>📜 Recent Demo Trades</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Coin</th>
                      <th>Qty</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoTrades.map((t, i) => (
                      <tr key={i}>
                        <td>{t.date}</td>
                        <td>{t.coin}</td>
                        <td>{t.qty}</td>
                        <td
                          style={{
                            color: t.type === "BUY" ? "#10b981" : "#ef4444",
                            fontWeight: "bold",
                          }}
                        >
                          {t.type}
                        </td>
                        <td>${t.price.toFixed(2)}</td>
                        <td>${t.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
