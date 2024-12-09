import React, { useState } from "react";
import HomeIcon from "./HomeIcon";

function FindOrder() {
  const [orderID, setOrderID] = useState(""); // Stores the input order ID
  const [orderDetails, setOrderDetails] = useState(null); // Stores detailed order data
  const [error, setError] = useState(null); // Stores any error messages
  const [loading, setLoading] = useState(false); // Indicates loading state

  const handleInputChange = (e) => {
    setOrderID(e.target.value); // Update order ID as user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setOrderDetails(null); // Clear previous order details
    setLoading(true); // Show loading indicator

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("You must be logged in to access this feature.");
        setLoading(false);
        return;
      }

      // Fetch order details
      const response = await fetch(`/order/${orderID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("API Response:", result); // Log API response for debugging
        setOrderDetails(result); // Store the entire order details
        setLoading(false);
      } else {
        const result = await response.json();
        setError(result.detail || "An error occurred.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <HomeIcon />
      <h1>Find Order Items</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Enter Order ID:
          <input
            type="number"
            value={orderID}
            onChange={handleInputChange}
            required
          />
        </label>
        <br />
        <button type="submit">Find</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && !error && orderDetails && (
        <div>
          <h2>Order Details</h2>
          <p>
            <strong>Order ID:</strong> {orderDetails.orderID}
          </p>
          <p>
            <strong>Items:</strong>
          </p>
          {orderDetails.items.length > 0 ? (
            <ul>
              {orderDetails.items.map((item, index) => (
                <li key={index}>
                  <strong>{item.description}</strong> (Color: {item.color}, Material: {item.material})
                  {item.pieces.length > 0 ? (
                    <ul>
                      {item.pieces.map((piece, idx) => (
                        <li key={idx}>
                          <strong>Piece {piece.pieceNum}:</strong> {piece.description} 
                          (Dimensions: {piece.dimensions.length}x{piece.dimensions.width}x{piece.dimensions.height}) 
                          - Room: {piece.location.roomNum}, Shelf: {piece.location.shelfNum} 
                          ({piece.location.shelfDescription})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No pieces for this item.</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items found for this order.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default FindOrder;
