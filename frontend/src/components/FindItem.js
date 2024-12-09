import React, { useState } from "react";
import HomeIcon from "./HomeIcon";

function FindItem() {
  const [itemID, setItemID] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setItemID(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setData(null);

    try {
      const token = localStorage.getItem("access_token"); // Retrieve the token
      if (!token) {
        setError("You must be logged in to access this feature.");
        return;
      }

      const response = await fetch(`/item/${itemID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.item); // Update to use the new response structure
      } else {
        const result = await response.json();
        setError(result.detail || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div>
      <HomeIcon />
      <h1>Find Item and Pieces</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Enter Item ID:
          <input
            type="number"
            value={itemID}
            onChange={handleInputChange}
            required
          />
        </label>
        <br />
        <button type="submit">Find</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {data && (
        <div>
          <h2>Item Details</h2>
          <p>
            <strong>Description:</strong> {data.description}
          </p>
          <p>
            <strong>Color:</strong> {data.color}
          </p>
          <p>
            <strong>Material:</strong> {data.material}
          </p>
          <p>
            <strong>New:</strong> {data.isNew ? "Yes" : "No"}
          </p>
          <p>
            <strong>Category:</strong> {data.mainCategory} - {data.subCategory}
          </p>

          <h3>Pieces</h3>
          {data.pieces.length > 0 ? (
            <ul>
              {data.pieces.map((piece, index) => (
                <li key={index}>
                  <strong>Piece {piece.pieceNum}:</strong> {piece.pDescription}{" "}
                  (Dimensions: {piece.length}x{piece.width}x{piece.height}) - Room:{" "}
                  {piece.roomNum}, Shelf: {piece.shelfNum} ({piece.pNotes || "No notes"})
                </li>
              ))}
            </ul>
          ) : (
            <p>No pieces found for this item.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default FindItem;
