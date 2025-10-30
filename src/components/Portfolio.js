import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import "./Portfolio.css";

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const res = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,cardano,solana,ripple"
      );

      const portfolioData = res.data.map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image,
        current_price: coin.current_price,
        holdings: Math.floor(Math.random() * 5 + 1), // mock holdings
      }));

      setHoldings(portfolioData);
    } catch (err) {
      console.error("Error loading portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = holdings.reduce(
    (sum, h) => sum + h.holdings * h.current_price,
    0
  );

  const COLORS = ["#f8c400", "#10b981", "#ef4444", "#3b82f6", "#a855f7"];

  return (
    <div className="portfolio-content">
      <h2>📁 Portfolio</h2>
      <p>Your crypto holdings overview (mock data + live prices)</p>

      {loading ? (
        <p>Loading portfolio...</p>
      ) : (
        <>
          <div className="portfolio-chart-section">
            <div className="chart-container">
              <h3>Holdings Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={holdings}
                    dataKey={(h) => h.holdings * h.current_price}
                    nameKey="name"
                    outerRadius={100}
                    fill="#8884d8"
                  >
                    {holdings.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p>Total Value: ${totalValue.toFixed(2)}</p>
            </div>

            <div className="holdings-summary">
              <h3>Holdings Summary</h3>
              <ul>
                {holdings.map((coin) => (
                  <li key={coin.id} className="holding-item">
                    <span className="coin-name">
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </span>
                    <span className="coin-value">
                      ${(coin.holdings * coin.current_price).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="holdings-table">
            <h3>Detailed Holdings</h3>
            <table>
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Holdings</th>
                  <th>Current Price</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((coin) => (
                  <tr key={coin.id}>
                    <td>
                      <img
                        src={coin.image}
                        alt={coin.name}
                        width="22"
                        style={{ marginRight: "8px" }}
                      />
                      {coin.name}
                    </td>
                    <td>{coin.holdings}</td>
                    <td>${coin.current_price.toLocaleString()}</td>
                    <td>
                      ${(coin.holdings * coin.current_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
