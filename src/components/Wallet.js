// src/components/Wallet.js
import React, { useEffect, useState } from "react";
import "./Wallet.css";

/**
 * Defensive Wallet component:
 * - Ignores invalid/huge stored values
 * - Defaults to 0 balance/spent/remaining
 * - Shows transactions only if they are valid objects
 */

const SAFE_START_BALANCE = 0; // change to 10000 if you want a demo balance

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  if (!isFinite(n) || isNaN(n)) return fallback;
  // clamp excessive values (safety)
  const ABS_MAX = 1e9; // 1 billion USD max for demo
  if (Math.abs(n) > ABS_MAX) return fallback;
  return n;
}

export default function Wallet() {
  const [balance, setBalance] = useState(SAFE_START_BALANCE);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    try {
      // load trades saved from app (if any)
      const rawTrades = localStorage.getItem("tradeHistory") || localStorage.getItem("transactions");
      const parsed = rawTrades ? JSON.parse(rawTrades) : null;

      if (Array.isArray(parsed) && parsed.length > 0) {
        // compute spent only from valid records
        const valid = parsed.filter(t => t && (t.total || t.value));
        const spent = valid.reduce((s, t) => s + safeNumber(t.total ?? t.value, 0), 0);
        setTotalSpent(safeNumber(spent, 0));
        setTransactions(valid.slice(0, 50)); // keep recent 50
        // If there is a saved wallet object, use it; otherwise keep default
        const savedWallet = JSON.parse(localStorage.getItem("wallet") || "null");
        if (savedWallet && typeof savedWallet.balanceUSD !== "undefined") {
          setBalance(safeNumber(savedWallet.balanceUSD, SAFE_START_BALANCE));
        } else {
          setBalance(SAFE_START_BALANCE);
        }
      } else {
        // No valid trades -> show zeros
        setBalance(SAFE_START_BALANCE);
        setTotalSpent(0);
        setTransactions([]);
      }
    } catch (err) {
      // If parsing fails, clear the suspect keys and reset to safe defaults
      console.warn("Wallet load error, resetting to zero:", err);
      localStorage.removeItem("tradeHistory");
      localStorage.removeItem("transactions");
      localStorage.removeItem("wallet");
      setBalance(SAFE_START_BALANCE);
      setTotalSpent(0);
      setTransactions([]);
    }
  }, []);

  const remaining = safeNumber(balance, 0) - safeNumber(totalSpent, 0);

  return (
    <div className="wallet-container">
      <h2>👛 Wallet</h2>
      <p>Your wallet overview and recent transactions</p>

      <div className="wallet-summary">
        <div className="wallet-card">
          <h3>Total Balance</h3>
          <p>${safeNumber(balance, 0).toLocaleString()}</p>
        </div>
        <div className="wallet-card">
          <h3>Total Spent</h3>
          <p>${safeNumber(totalSpent, 0).toFixed(2)}</p>
        </div>
        <div className="wallet-card">
          <h3>Remaining</h3>
          <p>${safeNumber(remaining, 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="wallet-transactions">
        <h3>Recent Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Coin</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="5">No transactions found.</td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id || t.date || Math.random()}>
                  <td>{t.date || "-"}</td>
                  <td>{t.coin || "-"}</td>
                  <td>{t.quantity ?? t.amount ?? "-"}</td>
                  <td>${safeNumber(t.total ?? t.value, 0).toFixed(2)}</td>
                  <td className="status-completed">{t.status || "Completed"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
