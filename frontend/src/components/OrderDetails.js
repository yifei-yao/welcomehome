import React, { useState, useEffect } from "react";

function OrderDetails({ orderId, token }) {
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrderDetails = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/order/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to fetch order details.");
        setOrderDetails(null);
      }
    } catch (err) {
      setError("An error occurred while fetching order details.");
      setOrderDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId && token) {
      fetchOrderDetails();
    }
  }, [orderId, token]);

  if (loading) {
    return <p>Loading order details...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!orderDetails) {
    return null; // Nothing to display if no data or error
  }

  return (
    <div>
      <h2>Order Details</h2>
      <p>
        <strong>Order ID:</strong> {orderDetails.orderID}
      </p>
      {orderDetails.items && orderDetails.items.length > 0 ? (
        <div>
          <h3>Items in Order:</h3>
          <ul>
            {orderDetails.items.map((item) => (
              <li key={item.itemID}>
                <p>
                  <strong>{item.description}</strong> (Color: {item.color}, Material: {item.material})
                </p>
                {item.pieces && item.pieces.length > 0 ? (
                  <ul>
                    {item.pieces.map((piece, index) => (
                      <li key={index}>
                        <strong>Piece {piece.pieceNum}:</strong> {piece.description} 
                        (Dimensions: {piece.dimensions.length}x{piece.dimensions.width}x{piece.dimensions.height}) - 
                        Room: {piece.location.roomNum}, Shelf: {piece.location.shelfNum} 
                        ({piece.location.shelfDescription || "No description available"})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No pieces for this item.</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No items in this order.</p>
      )}
      <button onClick={fetchOrderDetails}>Refresh Order Details</button>
    </div>
  );
}

export default OrderDetails;
