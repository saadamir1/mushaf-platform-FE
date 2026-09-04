import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { UI, VALIDATION } from '../utils/constants';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < UI.MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${UI.MIN_PASSWORD_LENGTH} characters long`);
      return;
    }

    if (formData.newPassword.length > UI.MAX_PASSWORD_LENGTH) {
      setError(`Password must not exceed ${UI.MAX_PASSWORD_LENGTH} characters`);
      return;
    }

    if (!VALIDATION.PASSWORD_REGEX.test(formData.newPassword)) {
      setError('Password must include uppercase, lowercase, and a number');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await authService.resetPassword(token, formData.newPassword);
      setSuccess('Password reset successfully! Redirecting to login...');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card modern">
          <h2>Invalid Reset Link</h2>
          <p className="auth-subtitle">This password reset link is invalid or has expired.</p>
          <button type="button" onClick={() => navigate('/login')} className="btn btn-primary btn-full">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card modern">
        <img src="/logo.png" alt="Mushaf" className="auth-logo" />
        <h2>Reset Password</h2>
        <p className="auth-subtitle">
          Use at least {UI.MIN_PASSWORD_LENGTH} characters with upper, lower, and a number.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              disabled={loading}
              minLength={UI.MIN_PASSWORD_LENGTH}
              maxLength={UI.MAX_PASSWORD_LENGTH}
              placeholder="Enter new password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login" className="auth-link">Back to Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
