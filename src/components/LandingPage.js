import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaRegStar, FaChartPie } from "react-icons/fa";
import "./LandingPage.css";

export default function LandingPage() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🪙 Fetch live crypto data from CoinGecko API
  useEffect(() => {
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false"
    )
      .then((res) => res.json())
      .then((data) => {
        setCoins(data);
        setLoading(false);
      })
      .catch((err) => console.error("Error fetching crypto data:", err));
  }, []);

  return (
    <div className="landing-page">
      {/* 🧭 Navbar */}
      <nav className="navbar">
        {/* ✅ Logo Section */}
        <div className="logo">
          <span className="logo-icon">SCS</span>
          <span className="logo-text">SafeCryptoStocks</span>
        </div>

        {/* ✅ Center Nav Links */}
        <ul className="nav-links">
          <li><button className="nav-btn">Buy Crypto</button></li>
          <li><button className="nav-btn">Dashboard</button></li>
          <li><button className="nav-btn">Exchange</button></li>
          <li><button className="nav-btn">More ▾</button></li>
        </ul>

        {/* ✅ Right Section */}
        <div className="nav-right">
          <div className="nav-icons">
            <div className="icon-item">
              <FaChartPie className="icon" /> <span>Portfolio</span>
            </div>
            <div className="icon-item">
              <FaRegStar className="icon" /> <span>Watchlist</span>
            </div>
          </div>

          {/* ✅ Search Box */}
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search" />
          </div>

          {/* ✅ Auth Buttons */}
          <div className="nav-auth">
            <Link to="/auth?mode=login">
              <button className="login-btn">Log In</button>
            </Link>
            <Link to="/auth?mode=signup">
              <button className="signup-btn">Sign Up</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 🏠 Hero Section */}
      <div className="hero-section">
        <div className="hero-left">
          <h1>
            <span>294,423</span>
            <br /> USERS TRUST US
          </h1>

          <div className="badges">
            <div className="badge">
              <span className="badge-title">No.1</span>
              <p>Customer Assets</p>
            </div>
            <div className="badge">
              <span className="badge-title">No.1</span>
              <p>Trading Volume</p>
            </div>
          </div>

          <div className="cta-section">
            <button className="bonus-btn">🎁 Up to $100 Bonus Only Today</button>
            <Link to="/auth?mode=signup">
              <button className="signup-btn main">Sign Up</button>
            </Link>
          </div>

          <div className="icons">
            <button className="icon-btn">G</button>
            <button className="icon-btn"></button>
            <button className="icon-btn">QR</button>
          </div>
        </div>

        <div className="hero-right">
          {/* ✅ Live Popular Coins Section */}
          <div className="card">
            <h3>Popular</h3>
            {loading ? (
              <p>Loading data...</p>
            ) : (
              <ul>
                {coins.map((coin) => (
                  <li key={coin.id}>
                    <span>
                      <img
                        src={coin.image}
                        alt={coin.name}
                        width="20"
                        height="20"
                        style={{ marginRight: "8px", verticalAlign: "middle" }}
                      />
                      {coin.symbol.toUpperCase()} {coin.name}
                    </span>
                    <span>${coin.current_price.toLocaleString()}</span>
                    <span
                      className={
                        coin.price_change_percentage_24h >= 0 ? "green" : "red"
                      }
                    >
                      {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                      {coin.price_change_percentage_24h.toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ✅ News Section */}
          <div className="card news">
            <h3>News</h3>
            <ul>
              <li>Crypto Industry Surpasses $10B in Third Quarter</li>
              <li>BNB Surpasses $1,150 USDT with 7.2% Increase</li>
              <li>ETH Acquires Stake in SEC Broker Liquidity.io</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
