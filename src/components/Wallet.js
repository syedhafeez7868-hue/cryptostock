// src/components/Wallet.js
import React, { useEffect, useState } from "react";
import { backend } from "./api";
import "./Wallet.css";

function getUserEmail() {
  try {
    const u = JSON.parse(localStorage.getItem("user"));
    return u?.email || "guest@example.com";
  } catch {
    return "guest@example.com";
  }
}

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const userEmail = getUserEmail();

  useEffect(() => {
    fetchWalletAndTrades();
    // optionally refresh every 10s
    const iv = setInterval(fetchWalletAndTrades, 10000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const fetchWalletAndTrades = async () => {
    try {
      setLoading(true);
      const [walletRes, tradeRes] = await Promise.all([
        backend.get(`/wallet/${userEmail}`),
        backend.get(`/trades/${userEmail}`),
      ]);
      setWallet(walletRes.data);
      setTransactions(tradeRes.data || []);
    } catch (err) {
      console.error("Error loading wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading wallet...</p>;
  if (!wallet) return <p>No wallet data found.</p>;

  const totalSpent = transactions.filter((t) => t.type === "BUY").reduce((s, t) => s + (t.total || 0), 0);
  const totalReceived = transactions.filter((t) => t.type === "SELL").reduce((s, t) => s + (t.total || 0), 0);
  const currentBalance = (wallet.balanceUsd || 0) + totalReceived - totalSpent;

  return (
    <div className="wallet-container">
      <h2>👛 Wallet</h2>
      <p>Your wallet overview and transaction summary</p>

      <div className="wallet-summary">
        <div className="wallet-card"><h3>Balance (USD)</h3><p>${currentBalance.toFixed(2)}</p></div>
        <div className="wallet-card"><h3>Total Spent</h3><p>${totalSpent.toFixed(2)}</p></div>
        <div className="wallet-card"><h3>Total Received</h3><p>${totalReceived.toFixed(2)}</p></div>
      </div>

      <div className="wallet-transactions">
        <h3>Recent Transactions</h3>
        <table>
          <thead><tr><th>Date</th><th>Coin</th><th>Qty</th><th>Type</th><th>Total</th></tr></thead>
          <tbody>
            {transactions.length === 0 ? (<tr><td colSpan="5">No transactions yet.</td></tr>) :
              transactions.slice(0, 10).map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.coinName}</td>
                  <td>{t.quantity}</td>
                  <td style={{ color: t.type === "BUY" ? "#ef4444" : "#10b981", fontWeight: "bold" }}>{t.type}</td>
                  <td>${(t.total || 0).toFixed(2)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
