import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HomeIcon from "./HomeIcon";

function Donate() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formData, setFormData] = useState({
    donor_username: "",
    item_description: "",
    photo: "",
    color: "",
    is_new: true,
    material: "",
    main_category: "",
    sub_category: "",
  });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [pieceData, setPieceData] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Check if the user is authorized (role: staff)
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/user-info", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthorized(data.role === "staff");
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        setIsAuthorized(false);
      }
    };

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

    const fetchRooms = async () => {
      try {
        const response = await fetch("/rooms", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setRooms(data.rooms);
        } else {
          setError("Failed to fetch rooms.");
        }
      } catch (err) {
        setError("An error occurred while fetching rooms.");
      }
    };

    fetchUserInfo();
    fetchCategories();
    fetchRooms();
  }, []);

  const handleCategoryChange = (e) => {
    const selectedMainCategory = e.target.value;
    setFormData({ ...formData, main_category: selectedMainCategory, sub_category: "" });

    const filteredSubCategories = categories
      .filter((cat) => cat.mainCategory === selectedMainCategory)
      .map((cat) => cat.subCategory);
    setSubCategories(filteredSubCategories);
  };

  const handleSubCategoryChange = (e) => {
    setFormData({ ...formData, sub_category: e.target.value });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePieceChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPieces = [...pieceData];
    updatedPieces[index][name] = value;
    setPieceData(updatedPieces);
  };

  const handleRoomChange = (index, e) => {
    const selectedRoom = e.target.value;
    const updatedPieces = [...pieceData];
    updatedPieces[index].roomNum = selectedRoom;
    updatedPieces[index].shelfNum = ""; // Reset shelf selection when room changes
    setPieceData(updatedPieces);

    const fetchShelves = async (roomNum) => {
      const token = localStorage.getItem("access_token");
      try {
        const response = await fetch(`/shelves?room_num=${roomNum}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setShelves(data.shelves);
        } else {
          setError("Failed to fetch shelves.");
        }
      } catch (err) {
        setError("An error occurred while fetching shelves.");
      }
    };

    if (selectedRoom) {
      fetchShelves(selectedRoom);
    }
  };

  const addPiece = () => {
    setPieceData([
      ...pieceData,
      {
        pieceNum: "",
        pDescription: "",
        length: "",
        width: "",
        height: "",
        roomNum: "",
        shelfNum: "",
        pNotes: "",
      },
    ]);
  };

  const removePiece = (index) => {
    const updatedPieces = [...pieceData];
    updatedPieces.splice(index, 1);
    setPieceData(updatedPieces);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("You must be logged in to submit a donation.");
        return;
      }

      const response = await fetch("/donate", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({
          ...formData,
          piece_data: JSON.stringify(pieceData),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Donation accepted! Item ID: ${data.item_id}`);
        setFormData({
          donor_username: "",
          item_description: "",
          photo: "",
          color: "",
          is_new: true,
          material: "",
          main_category: "",
          sub_category: "",
        });
        setPieceData([]);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "An error occurred.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  if (!isAuthorized) {
    return (
      <div>
        <h1>Unauthorized</h1>
        <p>You are not authorized to access this page.</p>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  return (
    <div>
      <HomeIcon />
      <h1>Accept Donation</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Donor Username:
          <input
            type="text"
            name="donor_username"
            value={formData.donor_username}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <label>
          Item Description:
          <textarea
            name="item_description"
            value={formData.item_description}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <label>
          Photo:
          <input
            type="text"
            name="photo"
            value={formData.photo}
            onChange={handleChange}
            placeholder="Enter photo URL or filename"
          />
        </label>
        <br />
        <label>
          Color:
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Is New:
          <input
            type="checkbox"
            name="is_new"
            checked={formData.is_new}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Material:
          <input
            type="text"
            name="material"
            value={formData.material}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Main Category:
          <select
            name="main_category"
            value={formData.main_category}
            onChange={handleCategoryChange}
            required
          >
            <option value="" disabled>
              Select a main category
            </option>
            {[...new Set(categories.map((cat) => cat.mainCategory))].map((mainCategory) => (
              <option key={mainCategory} value={mainCategory}>
                {mainCategory}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Sub Category:
          <select
            name="sub_category"
            value={formData.sub_category}
            onChange={handleSubCategoryChange}
            required
            disabled={!formData.main_category}
          >
            <option value="" disabled>
              Select a subcategory
            </option>
            {subCategories.map((subCategory) => (
              <option key={subCategory} value={subCategory}>
                {subCategory}
              </option>
            ))}
          </select>
        </label>
        <br />

        <div>
          <h3>Pieces</h3>
          {pieceData.map((piece, index) => (
            <div key={index}>
              <label>
                Piece Number:
                <input
                  type="number"
                  name="pieceNum"
                  value={piece.pieceNum}
                  onChange={(e) => handlePieceChange(index, e)}
                  required
                />
              </label>
              <br />
              <label>
                Description:
                <input
                  type="text"
                  name="pDescription"
                  value={piece.pDescription}
                  onChange={(e) => handlePieceChange(index, e)}
                />
              </label>
              <br />
              <label>
                Dimensions (L x W x H):
                <input
                  type="number"
                  name="length"
                  value={piece.length}
                  onChange={(e) => handlePieceChange(index, e)}
                  required
                />{" "}
                x
                <input
                  type="number"
                  name="width"
                  value={piece.width}
                  onChange={(e) => handlePieceChange(index, e)}
                  required
                />{" "}
                x
                <input
                  type="number"
                  name="height"
                  value={piece.height}
                  onChange={(e) => handlePieceChange(index, e)}
                  required
                />
              </label>
              <br />
              <label>
                Room Number:
                <select
                  name="roomNum"
                  value={piece.roomNum || ""}
                  onChange={(e) => handleRoomChange(index, e)}
                  required
                >
                  <option value="" disabled>
                    Select a room
                  </option>
                  {rooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </label>
              <br />
              <label>
                Shelf Number:
                <select
                  name="shelfNum"
                  value={piece.shelfNum || ""}
                  onChange={(e) => handlePieceChange(index, e)}
                  required
                  disabled={!piece.roomNum}
                >
                  <option value="" disabled>
                    Select a shelf
                  </option>
                  {shelves.map((shelf) => (
                    <option key={shelf} value={shelf}>
                      {shelf}
                    </option>
                  ))}
                </select>
              </label>
              <br />
              <label>
                Notes:
                <textarea
                  name="pNotes"
                  value={piece.pNotes}
                  onChange={(e) => handlePieceChange(index, e)}
                />
              </label>
              <button type="button" onClick={() => removePiece(index)}>
                Remove Piece
              </button>
              <hr />
            </div>
          ))}
          <button type="button" onClick={addPiece}>
            Add Piece
          </button>
        </div>

        <button type="submit">Accept Donation</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
}

export default Donate;
