import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/api";

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    // Separate states for each form
    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
            });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setProfileError("");
        setProfileSuccess("");

        try {
            await userService.updateProfile({
                firstName: formData.firstName,
                lastName: formData.lastName,
            });

            await refreshUser();
            setProfileSuccess("Profile updated successfully!");
            setTimeout(() => setProfileSuccess(""), 3000);
        } catch (err) {
            setProfileError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const validatePassword = (password) => {
        if (password.length < 8) {
            return "Password must be at least 8 characters";
        }
        if (password.length > 32) {
            return "Password must not exceed 32 characters";
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return "Password must contain uppercase, lowercase, and number";
        }
        return null;
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPasswordError("");
        setPasswordSuccess("");

        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords do not match");
            setLoading(false);
            return;
        }

        // Validate password strength
        const validationError = validatePassword(passwordData.newPassword);
        if (validationError) {
            setPasswordError(validationError);
            setLoading(false);
            return;
        }

        try {
            await userService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });

            setPasswordSuccess("Password changed successfully!");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            setTimeout(() => setPasswordSuccess(""), 3000);
        } catch (err) {
            setPasswordError(err.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        navigate("/login");
        return null;
    }

    return (
        <div className="profile-page">
            <div className="page-header">
                <h1>My Profile</h1>
            </div>

            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar-large">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <div className="profile-details">
                        <h2>{user.firstName} {user.lastName}</h2>
                        <p>{user.email}</p>
                        <span className="badge">{user.role}</span>
                    </div>
                </div>

                {/* Global error/success for general messages */}
                {(error || success) && (
                    <div className={error ? "error-message" : "success-message"}>
                        {error || success}
                    </div>
                )}

                <div className="profile-form-section">
                    <h3>Edit Profile</h3>

                    {/* Profile form errors/success */}
                    {profileError && <div className="error-message">{profileError}</div>}
                    {profileSuccess && <div className="success-message">{profileSuccess}</div>}

                    <form onSubmit={handleProfileSubmit} className="profile-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={user.email || ""}
                                disabled
                                className="disabled"
                            />
                            <small>Email cannot be changed</small>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                <div className="profile-form-section">
                    <h3>Change Password</h3>

                    {/* Password form errors/success - shows right above the password form */}
                    {passwordError && <div className="error-message">{passwordError}</div>}
                    {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

                    <form onSubmit={handlePasswordSubmit} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Enter current password"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Min 8 chars, uppercase, lowercase, number"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Confirm new password"
                            />
                        </div>

                        <button type="submit" className="btn btn-secondary" disabled={loading}>
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
