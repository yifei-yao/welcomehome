import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./style.css";
import Home from "./components/Home";
import Register from "./components/Register";
import Login from "./components/Login";
import FindItem from "./components/FindItem";
import NotFound from "./components/NotFound";
import FindOrder from "./components/FindOrder";
import Donate from "./components/Donate";
import StartOrder from "./components/StartOrder";
import AddToOrder from "./components/AddToOrder";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("access_token") ? true : false;
  });
  const [userInfo, setUserInfo] = useState(null);

  // Function to log in
  const login = async () => {
    setIsLoggedIn(true);
    await fetchUserInfo(); // Fetch user info after login
  };

  // Function to log out
  const logout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    setUserInfo(null); // Clear user info
  };

  // Fetch user info from the backend
  const fetchUserInfo = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch("/user-info", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo(data); // Save user info
      } else {
        console.error("Failed to fetch user info");
        logout(); // If fetching user info fails, log the user out
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      logout(); // If there's an error, log the user out
    }
  };

  // Validate token when the app loads
  const validateToken = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      logout(); // No token present, log the user out
      return;
    }

    try {
      const response = await fetch("/validate-token", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchUserInfo(); // Fetch user info if the token is valid
      } else {
        console.error("Token is invalid or expired.");
        logout(); // If token validation fails, log the user out
      }
    } catch (error) {
      console.error("Error validating token:", error);
      logout(); // Log the user out on error
    }
  };

  // Validate the token once when the app loads
  useEffect(() => {
    validateToken();
  }, []); // Empty dependency array ensures it runs once on mount

  return (
    <div className="container">
      <Router>
        <Routes>
          <Route path="/" element={<Home isLoggedIn={isLoggedIn} userInfo={userInfo} logout={logout} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login login={login} />} />
          <Route path="/find-item" element={<FindItem />} />
          <Route path="/find-order" element={<FindOrder />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/start-order" element={<StartOrder />} />
          <Route path="/add-to-order" element={<AddToOrder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
