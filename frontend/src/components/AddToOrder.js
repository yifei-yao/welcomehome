import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HomeIcon from "./HomeIcon";

function AddToOrder() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null); // Current order details
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const orderId = localStorage.getItem("current_order_id");
  const token = localStorage.getItem("access_token");

  // Fetch order details and categories when the page loads
  useEffect(() => {
    if (!orderId) {
      setError("No active order found. Redirecting to start order...");
      setTimeout(() => navigate("/start-order"), 2000);
      return;
    }

    fetchOrderDetails();
    fetchCategories();
  }, [navigate, orderId]);

  // Fetch current order details
  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/current-order?order_id=${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentOrder(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to fetch current order details.");
      }
    } catch (err) {
      setError("An error occurred while fetching current order details.");
    }
  };

  // Fetch available categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      } else {
        setError("Failed to fetch categories.");
      }
    } catch (err) {
      setError("An error occurred while fetching categories.");
    }
  };

  const handleCategoryChange = (e) => {
    const [mainCategory, subCategory] = e.target.value.split(",");
    setSelectedCategory(mainCategory);
    setSelectedSubCategory(subCategory);

    // Clear previous items and errors
    setAvailableItems([]);
    setSelectedItem(null);
    setError(null);
    setSuccess(null);

    // Fetch items for the selected category and subcategory
    fetchAvailableItems(mainCategory, subCategory);
  };

  const fetchAvailableItems = async (mainCategory, subCategory) => {
    try {
      const response = await fetch(
        `/available-items?mainCategory=${mainCategory}&subCategory=${subCategory}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.items.length === 0) {
          setError(`No available items for the selected category (${mainCategory} - ${subCategory}).`);
        } else {
          setAvailableItems(data.items);
        }
      } else {
        setError("Failed to fetch available items.");
      }
    } catch (err) {
      setError("An error occurred while fetching available items.");
    }
  };

  const handleAddToOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedItem) {
      setError("Please select an item to add.");
      return;
    }

    try {
      const response = await fetch("/add-to-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({
          item_id: selectedItem,
          current_order_id: orderId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);

        // Remove the added item from the available items
        setAvailableItems((prevItems) =>
          prevItems.filter((item) => item.ItemID !== parseInt(selectedItem, 10))
        );

        // Refresh current order details automatically
        fetchOrderDetails();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "An error occurred.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div>
      <HomeIcon />
      <h1>Add to Current Order</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {currentOrder ? (
        <div>
          <h2>Current Order Details</h2>
          <p>
            <strong>Order ID:</strong> {currentOrder.orderID}
          </p>
          <p>
            <strong>Order Date:</strong> {currentOrder.orderDate}
          </p>
          <p>
            <strong>Supervisor:</strong> {currentOrder.supervisor}
          </p>
          <p>
            <strong>Client:</strong> {currentOrder.client}
          </p>
          <p>
            <strong>Notes:</strong> {currentOrder.notes || "None"}
          </p>
          {currentOrder.items && currentOrder.items.length > 0 ? (
            <div>
              <h3>Items in Current Order:</h3>
              <ul>
                {currentOrder.items.map((item) => (
                  <li key={item.ItemID}>
                    {item.iDescription} - {item.color}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No items added to the order yet.</p>
          )}
        </div>
      ) : (
        <p>Loading current order details...</p>
      )}

      <label>
        Select Category:
        <select onChange={handleCategoryChange} defaultValue="">
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category, index) => (
            <option key={index} value={`${category.mainCategory},${category.subCategory}`}>
              {category.mainCategory} - {category.subCategory}
            </option>
          ))}
        </select>
      </label>
      <br />

      {availableItems.length > 0 ? (
        <>
          <label>
            Select Item:
            <select onChange={(e) => setSelectedItem(e.target.value)} defaultValue="">
              <option value="" disabled>
                Select an item
              </option>
              {availableItems.map((item) => (
                <option key={item.ItemID} value={item.ItemID}>
                  {item.iDescription} - {item.color}
                </option>
              ))}
            </select>
          </label>
          <br />
          <button onClick={handleAddToOrder}>Add to Order</button>
        </>
      ) : (
        selectedCategory &&
        selectedSubCategory &&
        !error && <p>No available items for the selected category and subcategory.</p>
      )}
    </div>
  );
}

export default AddToOrder;
