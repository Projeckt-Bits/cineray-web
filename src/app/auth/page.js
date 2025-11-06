"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setMessage("Login successful!");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  const handleSignUp = async () => {
    setError("");
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setMessage("Check your email for confirmation");
    } catch (err) {
      setError(err.message || "Sign up failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Authentication</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <div style={styles.buttonGroup}>
          <button onClick={handleLogin} style={styles.button}>
            Login
          </button>
          <button onClick={handleSignUp} style={styles.buttonSecondary}>
            Sign Up
          </button>
        </div>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  card: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  title: {
    margin: "0 0 1rem 0",
    textAlign: "center",
    color: "#333",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  buttonGroup: {
    display: "flex",
    gap: "0.5rem",
  },
  button: {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  buttonSecondary: {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  success: {
    color: "#28a745",
    textAlign: "center",
    margin: 0,
  },
  error: {
    color: "#dc3545",
    textAlign: "center",
    margin: 0,
  },
};
