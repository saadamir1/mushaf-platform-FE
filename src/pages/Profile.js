import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userService, uploadService } from "../services/api";

const Profile = () => {
    const { user, refreshUser, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Separate states for each form
    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [uploadingPicture, setUploadingPicture] = useState(false);

    // Delete account modal state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

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

    // Profile picture upload handler
    const handlePictureClick = () => {
        fileInputRef.current?.click();
    };

    const handlePictureChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPicture(true);
        try {
            await uploadService.uploadProfilePicture(user.id, file);
            await refreshUser();
            setProfileSuccess("Profile picture updated!");
            setTimeout(() => setProfileSuccess(""), 3000);
        } catch (err) {
            setProfileError(err.response?.data?.message || "Failed to upload picture");
        } finally {
            setUploadingPicture(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // Delete account handler
    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setDeleteError("");

        try {
            await userService.deleteAccount();
            logout();
            navigate("/");
        } catch (err) {
            setDeleteError(err.response?.data?.message || "Failed to delete account");
        } finally {
            setDeleteLoading(false);
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
                    <div
                        className="profile-avatar-large"
                        style={{ cursor: 'pointer', position: 'relative' }}
                        onClick={handlePictureClick}
                        title="Click to change profile picture"
                    >
                        {user.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            <>
                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </>
                        )}
                        {uploadingPicture && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.5)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.75rem'
                            }}>
                                Uploading...
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePictureChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <div className="profile-details">
                        <h2>{user.firstName} {user.lastName}</h2>
                        <p>{user.email}</p>
                        <span className="badge">{user.role}</span>
                    </div>
                </div>


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

                {/* Delete Account Section */}
                <div className="profile-form-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <h3 style={{ color: 'var(--danger-color)' }}>Danger Zone</h3>
                    <p style={{ color: 'var(--gray-color)', marginBottom: '1rem' }}>
                        Once you delete your account, there is no going back. Please be certain.
                    </p>

                    {!showDeleteConfirm ? (
                        <button
                            className="btn btn-danger"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Delete My Account
                        </button>
                    ) : (
                        <div style={{ background: 'rgba(220, 53, 69, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                            <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
                                Are you sure? This action cannot be undone.
                            </p>
                            {deleteError && <div className="error-message">{deleteError}</div>}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleDeleteAccount}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteError("");
                                    }}
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
