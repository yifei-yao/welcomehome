import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeIcon from "./HomeIcon";

function StartOrder() {
  const [clientUsername, setClientUsername] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("You must be logged in to start an order.");
        return;
      }

      const response = await fetch("/start-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({
          client_username: clientUsername,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrderId(data.order_id);
        localStorage.setItem("current_order_id", data.order_id); // Store order ID in localStorage
        navigate("/add-to-order"); // Redirect to Add to Order page
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to start the order.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div>
      <HomeIcon />
      <h1>Start Order</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {orderId ? (
        <p>Order started successfully! Order ID: {orderId}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Client Username:
            <input
              type="text"
              value={clientUsername}
              onChange={(e) => setClientUsername(e.target.value)}
              required
            />
          </label>
          <button type="submit">Start Order</button>
        </form>
      )}
    </div>
  );
}

export default StartOrder;
