import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/api";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError("Please enter your email address");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            await authService.forgotPassword(email);
            setMessage("If an account exists with this email, you will receive a password reset link shortly.");

            // Clear form and show success
            setEmail("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card modern">
                <div className="auth-icon">🔐</div>
                <h2>Forgot Password?</h2>
                <p className="auth-subtitle">Enter your email to receive a reset link</p>

                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            required
                            autoFocus
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Remember your password?{" "}
                        <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
