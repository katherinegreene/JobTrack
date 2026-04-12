//login.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const login = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const res = await fetch("http://127.0.0.1:5000/login", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Login successful!");
                navigate("/dashboard");
            } else {
                setMessage(` ${data.error || "Login failed"}`);
            }
        } catch (error) {
            console.error(error);
            setMessage(" Server error - check Flask backend");
        }
    };
    ////return 
    return (
        <div style={{ padding: "50px", background: "black", color: "#00FF7F", minHeight: "100vh" }}>
            <div style={{ maxWidth: "400px", margin: "auto", background: "#222", padding: "40px", borderRadius: "10px" }}>
                <h1>JobTrack Login</h1>
                <form onSubmit={login}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email"
                        style={{ width: "100%", padding: "12px", margin: "10px 0", background: "#111", border: "1px solid #00FF7F", color: "#00FF7F", borderRadius: "5px" }}
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        style={{ width: "100%", padding: "12px", margin: "10px 0", background: "#111", border: "1px solid #00FF7F", color: "#00FF7F", borderRadius: "5px" }}
                        required
                    />
                    <button
                        type="submit"
                        style={{ width: "100%", padding: "12px", background: "#00FF7F", color: "black", border: "none", borderRadius: "5px", fontWeight: "bold", fontSize: "16px" }}
                    >
                        Login
                    </button>
                </form>
                <p style={{ marginTop: "20px", color: message.includes("") ? "#00FF7F" : "red" }}>
                    {message}
                </p>
            </div>
        </div>
    );
}

export default Login;