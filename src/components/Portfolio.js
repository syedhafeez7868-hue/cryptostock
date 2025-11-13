// src/components/Portfolio.js
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  LineChart,
  Line,
} from "recharts";
import { backend } from "./api";
import "./Portfolio.css";
import { getUserEmail } from "./utils";
import { useNavigate } from "react-router-dom";

/**
 * Portfolio component
 * - Expects backend endpoints:
 *   GET /portfolio/:email  -> returns mapping { "<coinId or coinName>": quantity, ... }
 *   GET /trades/:email     -> returns list of trades with shape confirmed earlier
 * - Uses CoinGecko markets endpoint to enrich coin info
 */

export default function Portfolio() {
  const userEmail = getUserEmail();
  const navigate = useNavigate();

  const [holdings, setHoldings] = useState([]); // final enriched array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // refresh toggle -> used to trigger re-fetch after deposits/trades
  const [refreshTick, setRefreshTick] = useState(0);

  // Polling interval (ms)
  const POLL_MS = 15000;

  useEffect(() => {
    if (!userEmail) {
      setHoldings([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    async function loadAll() {
      try {
        setLoading(true);
        setError("");

        // 1) fetch portfolio mapping & trades in parallel
        const [portRes, tradesRes] = await Promise.all([
          backend.get(`/portfolio/${userEmail}`), // expected: { "bitcoin": 0.5, "binancecoin": 2, ... }
          backend.get(`/trades/${userEmail}`), // expected: array of trade objects (BUY/SELL)
        ]);
        const holdingsMap = portRes.data || {};
        const trades = tradesRes.data || [];

        // 2) fetch market data for top 50 coins (enough to include most holdings)
        const cgRes = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "usd",
              order: "market_cap_desc",
              per_page: 50,
              page: 1,
              sparkline: true,
              price_change_percentage: "24h",
            },
          }
        );

        const coins = cgRes.data || [];

        // Build enriched holdings array
        const portfolioArray = coins
          .map((coin) => {
            // quantity: try by id then by name (your backend might store either)
            const qty =
              Number(holdingsMap[coin.id] ?? holdingsMap[coin.name] ?? 0) || 0;
            if (qty <= 0) return null;

            // trades for this coin
            const coinTrades = trades.filter(
              (t) =>
                (t.coinId && t.coinId.toLowerCase() === coin.id.toLowerCase()) ||
                (t.coinName && t.coinName.toLowerCase() === coin.name.toLowerCase())
            );

            // compute avg buy price, realized P/L
            let totalBought = 0;
            let qtyBought = 0;
            let totalSold = 0;
            let qtySold = 0;
            let realizedPL = 0; // realized from sells (approximate using FIFO is complex; we'll compute realized as sum(sell.total) - qtySold * avgBuyAtSellTime (approximate))
            // We'll compute a simple realized: sum(sell.total) - qtySold * avgBuyPrice (avg of buys) for quick view
            coinTrades.forEach((t) => {
              if (!t.type) return;
              const q = Number(t.quantity || 0);
              const p = Number(t.price || 0);
              const tot = Number(t.total || p * q || 0);
              if (t.type === "BUY") {
                totalBought += tot;
                qtyBought += q;
              } else if (t.type === "SELL") {
                totalSold += tot;
                qtySold += q;
              }
            });

            const netQty = qtyBought - qtySold;
            // Use netQty as sanity check — but displayed qty comes from holdingsMap (DB snapshot)
            const avgBuyPrice = qtyBought > 0 ? totalBought / qtyBought : 0;

            // approximate realized P/L:
            realizedPL = totalSold - qtySold * avgBuyPrice;

            const currentPrice = Number(coin.current_price || 0);
            const marketValue = Number((qty * currentPrice) || 0);
            const invested = totalBought - totalSold; // money in minus money out (approx.)
            const unrealizedPL = qty * currentPrice - qty * avgBuyPrice;
            const totalPL = realizedPL + unrealizedPL;

            return {
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              image: coin.image,
              current_price: currentPrice,
              holdings: qty,
              market_value: marketValue,
              avg_buy_price: avgBuyPrice,
              invested,
              unrealizedPL,
              realizedPL,
              totalPL,
              price_change_24h: coin.price_change_percentage_24h,
              sparkline: coin.sparkline_in_7d?.price || [],
            };
          })
          .filter(Boolean);

        // If holdingsMap contains coins outside top50, attempt to fetch them individually
        // (for completeness) — only if portfolioArray doesn't include an id existing in holdingsMap
        const foundIds = new Set(portfolioArray.map((p) => p.id));
        const missingKeys = Object.keys(holdingsMap).filter(
          (k) => Number(holdingsMap[k] || 0) > 0 && !foundIds.has(k)
        );

        if (missingKeys.length > 0) {
          const missingFetches = await Promise.all(
            missingKeys.map(async (k) => {
              try {
                // try coin by id
                const res = await axios.get(
                  `https://api.coingecko.com/api/v3/coins/markets`,
                  { params: { vs_currency: "usd", ids: k, sparkline: true } }
                );
                return res.data && res.data[0];
              } catch (e) {
                return null;
              }
            })
          );

          missingFetches.forEach((coin) => {
            if (!coin) return;
            const qty = Number(holdingsMap[coin.id] ?? holdingsMap[coin.name] ?? 0);
            if (!qty || qty <= 0) return;

            // trades for this coin
            const coinTrades = trades.filter(
              (t) =>
                (t.coinId && t.coinId.toLowerCase() === coin.id.toLowerCase()) ||
                (t.coinName && t.coinName.toLowerCase() === coin.name.toLowerCase())
            );

            let totalBought = 0, qtyBought = 0, totalSold = 0, qtySold = 0;
            coinTrades.forEach((t) => {
              const q = Number(t.quantity || 0);
              const p = Number(t.price || 0);
              const tot = Number(t.total || p * q || 0);
              if (t.type === "BUY") {
                totalBought += tot; qtyBought += q;
              } else if (t.type === "SELL") {
                totalSold += tot; qtySold += q;
              }
            });

            const avgBuyPrice = qtyBought > 0 ? totalBought / qtyBought : 0;
            const realizedPL = totalSold - qtySold * avgBuyPrice;
            const currentPrice = Number(coin.current_price || 0);
            const marketValue = qty * currentPrice;
            const invested = totalBought - totalSold;
            const unrealizedPL = qty * currentPrice - qty * avgBuyPrice;
            const totalPL = realizedPL + unrealizedPL;

            portfolioArray.push({
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              image: coin.image,
              current_price: currentPrice,
              holdings: qty,
              avg_buy_price: avgBuyPrice,
              invested,
              unrealizedPL,
              realizedPL,
              totalPL,
              price_change_24h: coin.price_change_percentage_24h,
              sparkline: coin.sparkline_in_7d?.price || [],
            });
          });
        }

        if (mounted) {
          setHoldings(portfolioArray);
        }
      } catch (err) {
        console.error("Portfolio load error:", err?.response?.data || err.message || err);
        if (mounted) setError("Failed to load portfolio");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();

    // polling
    const iv = setInterval(() => {
      setRefreshTick((t) => t + 1);
    }, POLL_MS);

    return () => {
      mounted = false;
      clearInterval(iv);
    };
    // refreshTick included so external triggers can force reload
  }, [userEmail, refreshTick]);

  // Memoized totals
  const totals = useMemo(() => {
    const totalValue = holdings.reduce((s, h) => s + (h.market_value || 0), 0);
    const totalInvested = holdings.reduce((s, h) => s + (h.invested || 0), 0);
    const unrealized = holdings.reduce((s, h) => s + (h.unrealizedPL || 0), 0);
    const realized = holdings.reduce((s, h) => s + (h.realizedPL || 0), 0);
    const totalPL = unrealized + realized;
    return { totalValue, totalInvested, unrealized, realized, totalPL };
  }, [holdings]);

  const COLORS = ["#f8c400", "#10b981", "#ef4444", "#3b82f6", "#a855f7", "#06b6d4", "#f97316"];

  if (!userEmail) {
    return (
      <div className="portfolio-content">
        <h2>📁 Portfolio</h2>
        <p>Please log in to see your portfolio.</p>
      </div>
    );
  }

  return (
    <div className="portfolio-content">
      <h2>📁 Portfolio</h2>
      <p>Live holdings fetched from database (auto-updated on trades)</p>

      {loading ? (
        <p className="loading-text">Loading portfolio...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : holdings.length === 0 ? (
        <p className="loading-text">No holdings yet.</p>
      ) : (
        <>
          <div className="portfolio-top-cards" style={{ display: "flex", gap: 16, marginBottom: 18 }}>
            <div className="summary-card" style={{ flex: 1 }}>
              <h4>Total Value</h4>
              <div style={{ fontSize: 20, fontWeight: 700 }}>${totals.totalValue.toFixed(2)}</div>
              <div style={{ marginTop: 6, color: "#9fb0b3" }}>Invested: ${totals.totalInvested.toFixed(2)}</div>
            </div>

            <div className="summary-card" style={{ flex: 1 }}>
              <h4>Unrealized P/L</h4>
              <div style={{ fontSize: 20, fontWeight: 700, color: totals.unrealized >= 0 ? "#10b981" : "#ef4444" }}>
                ${totals.unrealized.toFixed(2)}
              </div>
              <div style={{ marginTop: 6, color: "#9fb0b3" }}>Realized: ${totals.realized.toFixed(2)}</div>
            </div>

            <div className="summary-card" style={{ flex: 1 }}>
              <h4>Total P/L</h4>
              <div style={{ fontSize: 20, fontWeight: 700, color: totals.totalPL >= 0 ? "#10b981" : "#ef4444" }}>
                ${totals.totalPL.toFixed(2)}
              </div>
              <div style={{ marginTop: 6, color: "#9fb0b3" }}>Allocation & Performance</div>
            </div>
          </div>

          <div className="portfolio-chart-section" style={{ display: "flex", gap: 20 }}>
            <div className="chart-container" style={{ flex: 1, minWidth: 340 }}>
              <h3>Holdings Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={holdings}
                    dataKey="market_value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={2}
                  >
                    {holdings.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(val) => `$${Number(val).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign: "center", marginTop: 8, color: "#9fb0b3" }}>
                Total Value: ${totals.totalValue.toFixed(2)}
              </div>
            </div>

            <div className="holdings-summary" style={{ flex: 1 }}>
              <h3>Holdings Summary</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {holdings.map((c, idx) => {
                  const allocation = totals.totalValue ? (c.market_value / totals.totalValue) * 100 : 0;
                  return (
                    <li key={c.id} className="holding-item" style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img src={c.image} width="28" height="28" style={{ borderRadius: 6 }} alt={c.symbol} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{c.name} <span style={{ color: "#9fb0b3", fontWeight: 600 }}>({c.symbol.toUpperCase()})</span></div>
                          <div style={{ color: "#9fb0b3", fontSize: 13 }}>
                            Qty: {c.holdings} • Avg: ${c.avg_buy_price ? c.avg_buy_price.toFixed(2) : "—"}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", minWidth: 220 }}>
                        <div style={{ fontWeight: 700 }}>${c.market_value.toFixed(2)}</div>
                        <div style={{ color: c.totalPL >= 0 ? "#10b981" : "#ef4444", fontSize: 13 }}>
                          {c.totalPL >= 0 ? "+" : ""}${c.totalPL.toFixed(2)}
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, justifyContent: "flex-end" }}>
                          {/* small sparkline */}
                          <div style={{ width: 90, height: 34 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={(c.sparkline || []).map((p,i)=>({i, price:p}))}>
                                <Line type="monotone" dataKey="price" stroke={c.price_change_24h >= 0 ? "#10b981" : "#ef4444"} strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          <div style={{ textAlign: "right", minWidth: 88 }}>
                            <div style={{ fontSize: 13, color: "#9fb0b3" }}>{allocation.toFixed(1)}%</div>
                            <div style={{ fontSize: 13, color: c.price_change_24h >= 0 ? "#10b981" : "#ef4444" }}>
                              {c.price_change_24h !== undefined ? `${c.price_change_24h?.toFixed(2)}%` : "—"}
                            </div>
                          </div>

                          <div>
                            <button className="trade-btn" onClick={() => navigate(`/market/${c.id}`)} style={{ marginLeft: 8 }}>Trade</button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
