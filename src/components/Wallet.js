import React, { useEffect, useState } from "react";
import { backend } from "./api";
import "./Wallet.css";
import { getUserEmail } from "./utils";

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("DEPOSIT");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const userEmail = getUserEmail();

  useEffect(() => {
    fetchWalletAndTransactions();
  }, []);

  const fetchWalletAndTransactions = async () => {
    try {
      setLoading(true);
      const [walletRes, tradesRes] = await Promise.all([
        backend.get(`/wallet/${userEmail}`),
        backend.get(`/trades/${userEmail}`)
      ]);

      setWallet(walletRes.data);
      const walletTx = (tradesRes.data || []).filter(
        (t) => t.type === "DEPOSIT" || t.type === "WITHDRAW"
      );
      setTransactions(walletTx);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode) => {
    setModalMode(mode);
    setAmount("");
    setPaymentMethod("");
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ----------------------------------------------------
  //  RAZORPAY PAYMENT
  // ----------------------------------------------------
  const handleRazorpayPayment = async () => {
    if (!amount || amount <= 0) return alert("Enter valid amount");

    try {
      const { data } = await backend.post("/razorpay/create-order", {
        amount,
        email: userEmail,
      });

      const options = {
        key: data.key,                     // <-- IMPORTANT
        amount: data.amount,
        currency: data.currency,
        name: "SafeCryptoStocks",
        description: "Wallet Deposit",
        order_id: data.id,

        handler: async function (response) {
          await backend.post("/razorpay/verify-payment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            email: userEmail,
            amount
          });

          await fetchWalletAndTransactions();
          closeModal();
          alert("✅ Deposit Successful!");
        },

        prefill: {
          email: userEmail,
          contact: "9876543210",
        },

        theme: {
          color: "#f8c400",
        },
      };

      const razorpayObject = new window.Razorpay(options);
      razorpayObject.open();

    } catch (e) {
      console.error(e);
      alert("Razorpay payment failed to start.");
    }
  };

  // ----------------------------------------------------
  // MODAL CONFIRM BUTTON HANDLER
  // ----------------------------------------------------
  const submitModal = async () => {
    if (!amount || amount <= 0) return alert("Enter valid amount");

    if (modalMode === "DEPOSIT") {
      if (paymentMethod === "razorpay") {
        handleRazorpayPayment();
        return;
      }

      // Simulated deposit (UPI / Card)
      const newBalance = (wallet.balanceUsd || 0) + Number(amount);

      await backend.post("/wallet/update", {
        email: userEmail,
        balanceUsd: newBalance,
      });

      await backend.post("/trades", {
        email: userEmail,
        type: "DEPOSIT",
        coinId: "usd-wallet",
        coinName: "USD",
        symbol: "USD",
        quantity: Number(amount),
        price: 1,
        total: Number(amount),
        status: "Completed",
        date: new Date().toLocaleString()
      });

      fetchWalletAndTransactions();
      closeModal();
      alert("Deposit successful");
      return;
    }

    // WITHDRAW
    const newBalance = wallet.balanceUsd - Number(amount);
    if (newBalance < 0) return alert("Insufficient balance!");

    await backend.post("/wallet/update", {
      email: userEmail,
      balanceUsd: newBalance,
    });

    await backend.post("/trades", {
      email: userEmail,
      type: "WITHDRAW",
      total: Number(amount),
      status: "Completed",
      date: new Date().toLocaleString(),
    });

    fetchWalletAndTransactions();
    closeModal();
  };

  if (loading) return <p>Loading wallet...</p>;

  return (
    <div className="wallet-page">
      <h2>👛 Wallet</h2>
      <p>Your wallet overview and transaction summary</p>

      <div className="wallet-summary-container">
        <div className="wallet-summary-left">
          <h3>Balance (USD)</h3>
          <p className="wallet-balance">
            ${(wallet.balanceUsd || 0).toFixed(2)}
          </p>

          <div className="wallet-btns">
            <button className="btn-deposit" onClick={() => openModal("DEPOSIT")}>
              Deposit
            </button>
            <button className="btn-withdraw" onClick={() => openModal("WITHDRAW")}>
              Withdraw
            </button>
          </div>
        </div>

        <div className="wallet-summary-right">
          <div className="summary-box deposit">
            <h4>Total Deposited</h4>
            <p>
              $
              {transactions
                .filter((t) => t.type === "DEPOSIT")
                .reduce((a, b) => a + b.total, 0)
                .toFixed(2)}
            </p>
          </div>

          <div className="summary-box withdraw">
            <h4>Total Withdrawn</h4>
            <p>
              $
              {transactions
                .filter((t) => t.type === "WITHDRAW")
                .reduce((a, b) => a + b.total, 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ---------- MODAL ---------- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{modalMode === "DEPOSIT" ? "Deposit Funds" : "Withdraw Funds"}</h3>

            <input
              type="number"
              value={amount}
              placeholder="Enter Amount (USD)"
              onChange={(e) => setAmount(e.target.value)}
            />

            {modalMode === "DEPOSIT" && (
              <div className="payment-options">
                <p>Select Payment Method:</p>
                <div className="payment-btns">
                  <button
                    onClick={() => setPaymentMethod("upi")}
                    className={paymentMethod === "upi" ? "active" : ""}
                  >
                    🏦 UPI
                  </button>
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={paymentMethod === "card" ? "active" : ""}
                  >
                    💳 Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod("razorpay")}
                    className={paymentMethod === "razorpay" ? "active" : ""}
                  >
                    💠 Razorpay
                  </button>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="modal-confirm-btn" onClick={submitModal}>
                Confirm
              </button>
              <button className="modal-cancel-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- HISTORY ---------- */}
      <div className="wallet-history-section">
        <h3>Deposit / Withdraw History</h3>
        <div className="wallet-table-box">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan="4">No transactions.</td></tr>
              ) : (
                transactions
                  .slice()
                  .reverse()
                  .map((t) => (
                    <tr key={t.id || t.date}>
                      <td>{t.date}</td>
                      <td style={{ color: t.type === "WITHDRAW" ? "red" : "green" }}>
                        {t.type}
                      </td>
                      <td>${t.total.toFixed(2)}</td>
                      <td>{t.status}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
