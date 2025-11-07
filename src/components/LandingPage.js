import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaCog, FaLock } from "react-icons/fa";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import "./LandingPage.css";

export default function LandingPage() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [expandedCoin, setExpandedCoin] = useState(null);
  const navigate = useNavigate();

  // 🪙 Fetch live crypto data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h"
        );
        const data = await res.json();
        setCoins(data);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔐 Redirect to login for protected tabs
  const handleProtectedTab = (action) => {
    alert(`🔒 Please login to ${action} coins.`);
    navigate("/auth?mode=login");
  };

  // 🧭 Render Content
  const renderContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <>
            <h2 className="section-title">📊 Market Overview</h2>
            <p className="subtext">Live data of top 20 cryptocurrencies</p>

            {/* Stats Section */}
            <div className="stats">
              <div className="stat-card">
                <h4>Total Market Cap</h4>
                <p>—</p>
              </div>
              <div className="stat-card">
                <h4>24h Avg Change</h4>
                <p>—</p>
              </div>
              <div className="stat-card">
                <h4>Total Coins</h4>
                <p>{coins.length}</p>
              </div>
            </div>

            {/* Coin Cards */}
            <div className="coin-section">
              <h3>Top 10 Coins — Click to Expand</h3>
              <div className="coin-grid">
                {loading ? (
                  <p>Loading live market data...</p>
                ) : (
                  coins.slice(0, 10).map((coin) => (
                    <div
                      key={coin.id}
                      className={`coin-card ${
                        expandedCoin === coin.id ? "expanded" : ""
                      }`}
                    >
                      <div className="coin-info">
                        <img
                          src={coin.image}
                          alt={coin.name}
                          width="28"
                          height="28"
                        />
                        <span>
                          {coin.name} ({coin.symbol.toUpperCase()})
                        </span>
                      </div>
                      <p className="coin-price">
                        ${coin.current_price.toLocaleString()}
                      </p>
                      <button
                        className="open-btn"
                        onClick={() =>
                          setExpandedCoin(
                            expandedCoin === coin.id ? null : coin.id
                          )
                        }
                      >
                        {expandedCoin === coin.id ? "Close" : "Open"}
                      </button>

                      {/* Expanded Graph & Trade Buttons */}
                      {expandedCoin === coin.id && (
                        <div className="expanded-section">
                          <div className="market-graph">
                            <ResponsiveContainer width="100%" height={150}>
                              <LineChart
                                data={coin.sparkline_in_7d.price.map(
                                  (p, i) => ({
                                    i,
                                    price: p,
                                  })
                                )}
                              >
                                <Line
                                  type="monotone"
                                  dataKey="price"
                                  stroke={
                                    coin.price_change_percentage_24h >= 0
                                      ? "#10b981"
                                      : "#ef4444"
                                  }
                                  dot={false}
                                  strokeWidth={2}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="trade-actions">
                            <button
                              className="settings-btn"
                              onClick={() => handleProtectedTab("buy")}
                            >
                              Buy
                            </button>
                            <button
                              className="logout-btn"
                              onClick={() => handleProtectedTab("sell")}
                            >
                              Sell
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        );

      case "Markets":
        return (
          <div className="markets-section">
            <h2 className="section-title">📈 Live Markets</h2>
            <p className="subtext">All top cryptocurrencies and their data</p>

            {loading ? (
              <p>Loading market data...</p>
            ) : (
              <div className="markets-grid">
                {coins.slice(0, 12).map((coin) => (
                  <div key={coin.id} className="market-card">
                    <div className="market-header">
                      <div className="market-info">
                        <img
                          src={coin.image}
                          alt={coin.name}
                          width="28"
                          height="28"
                        />
                        <div>
                          <div className="coin-name">
                            {coin.name} ({coin.symbol.toUpperCase()})
                          </div>
                          <div className="coin-price">
                            ${coin.current_price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div
                        className={
                          coin.price_change_percentage_24h >= 0
                            ? "green"
                            : "red"
                        }
                      >
                        {coin.price_change_percentage_24h?.toFixed(2)}%
                      </div>
                    </div>

                    {/* Small Graph */}
                    <div className="market-graph">
                      <ResponsiveContainer width="100%" height={60}>
                        <LineChart
                          data={coin.sparkline_in_7d.price.map((p, i) => ({
                            i,
                            price: p,
                          }))}
                        >
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke={
                              coin.price_change_percentage_24h >= 0
                                ? "#10b981"
                                : "#ef4444"
                            }
                            dot={false}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Buy / Sell */}
                    <div className="trade-actions">
                      <button
                        className="settings-btn"
                        onClick={() => handleProtectedTab("buy")}
                      >
                        Buy
                      </button>
                      <button
                        className="logout-btn"
                        onClick={() => handleProtectedTab("sell")}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "Portfolio":
      case "Trade":
      case "Wallet":
        handleProtectedTab(activeTab);
        return null;

      case "History":
        return (
          <h2 className="section-title">
            📜 "Safe" and "stable" are relative terms in the inherently volatile cryptocurrency space; there are no truly risk-free crypto stocks. Traditional stocks related to established crypto companies or with indirect crypto exposure offer more stability than direct investment in most cryptocurrencies."
          </h2>
        );

      default:
        return null;
    }
  };

  return (
    <div className="landing-dashboard">
      {/* 🔝 Top Navbar */}
      <div className="topbar">
        <div className="top-left">
          <h2 className="brand-top">SafeCryptoStocks</h2>
        </div>
        <div className="top-right">
          <div className="search-area">
            <input type="text" placeholder="Search by symbol..." />
            <FaSearch className="search-icon" />
          </div>
          <div className="topbar-actions">
            <button className="settings-btn">
              <FaCog /> Settings
            </button>
            <Link to="/auth?mode=login">
              <button className="logout-btn">
                <FaLock /> Login
              </button>
            </Link>
            <Link to="/auth?mode=signup">
              <button className="signup-btn">Sign Up</button>
            </Link>
          </div>
        </div>
      </div>

      {/* 🧭 Sidebar + Main Content */}
      <div className="main-layout">
        <aside className="sidebar">
          <ul>
            {["Overview", "Markets", "Portfolio", "Trade", "Wallet", "History"].map(
              (item) => (
                <li
                  key={item}
                  className={activeTab === item ? "active" : ""}
                  onClick={() => setActiveTab(item)}
                >
                  {item}
                </li>
              )
            )}
          </ul>
        </aside>

        {/* 🧩 Dynamic Content Area */}
        <main className="main-content">{renderContent()}</main>
      </div>
    </div>
  );
}
