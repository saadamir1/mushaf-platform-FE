import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { authService } from "../services/api";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      authService.verifyEmail(token)
        .then((response) => {
          setStatus("success");
        })
        .catch((error) => {
          setStatus("error");
        });
    } else {
      setStatus("error");
    }
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-card modern">
        {status === "verifying" && (
          <div>
            <div className="auth-icon">⏳</div>
            <h2>Verifying Email...</h2>
            <p>Please wait while we verify your email address.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="auth-icon">✅</div>
            <h2>Email Verified!</h2>
            <p>Your email has been verified successfully. You can now login to your account.</p>
            <div className="auth-footer" style={{ marginTop: '20px' }}>
              <Link to="/login" className="auth-link">Go to Login</Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="auth-icon">❌</div>
            <h2>Verification Failed</h2>
            <p>The verification link may be invalid or expired. Please try requesting a new verification email.</p>
            <div className="auth-footer" style={{ marginTop: '20px' }}>
              <Link to="/login" className="auth-link">Go to Login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
