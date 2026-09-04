import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userService, uploadService } from "../services/api";

const Admin = () => {
    const { user: currentUser, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [pageNumber, setPageNumber] = useState("");
    const [pageFile, setPageFile] = useState(null);
    const [uploadBusy, setUploadBusy] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
        } else if (!isAdmin) {
            navigate("/");
        }
    }, [currentUser, isAdmin, navigate]);

    useEffect(() => {
        if (currentUser && isAdmin) {
            fetchUsers();
        }
    }, [currentUser, isAdmin]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await userService.getAllUsers();
            setUsers(response.data.data || []);
        } catch (err) {
            setError("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleMushafUpload = async (e) => {
        e.preventDefault();
        if (!pageFile) {
            setError("Choose a page image first");
            return;
        }
        try {
            setUploadBusy(true);
            setError("");
            const res = await uploadService.uploadMushafPage(pageFile, pageNumber || undefined);
            const m = res.data?.mapping;
            setSuccess(
                `Page ${res.data?.page?.pageNumber} saved. Map auto-updated (${m?.contentStart}–${m?.contentEnd}).`,
            );
            setPageFile(null);
            setPageNumber("");
            setTimeout(() => setSuccess(""), 5000);
        } catch (err) {
            setError(err.response?.data?.message || "Page upload failed");
        } finally {
            setUploadBusy(false);
        }
    };

    const handleRemap = async () => {
        try {
            setUploadBusy(true);
            const res = await uploadService.remapPages();
            const m = res.data;
            setSuccess(`Remap done: content ${m.contentStart}–${m.contentEnd}`);
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            setError(err.response?.data?.message || "Remap failed");
        } finally {
            setUploadBusy(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        // Prevent deleting yourself
        if (userId === currentUser.id) {
            setError("You cannot delete your own account");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
        }

        try {
            setActionLoading(userId);
            await userService.deleteUser(userId);
            setSuccess("User deleted successfully");
            setUsers(users.filter(u => u.id !== userId));
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete user");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        // Prevent changing own role
        if (userId === currentUser.id) {
            setError("You cannot change your own role");
            return;
        }

        try {
            setActionLoading(`role-${userId}`);
            await userService.updateUser(userId, { role: newRole });
            setSuccess(`User role changed to ${newRole}`);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update role");
        } finally {
            setActionLoading(null);
        }
    };

    const handleEditUser = async (userId, firstName, lastName) => {
        try {
            setActionLoading(`edit-${userId}`);
            await userService.updateUser(userId, { firstName, lastName });
            setSuccess("User updated successfully");
            setUsers(users.map(u => u.id === userId ? { ...u, firstName, lastName } : u));
            setEditingUser(null);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update user");
        } finally {
            setActionLoading(null);
        }
    };

    if (!currentUser || !isAdmin) {
        return null;
    }

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>Admin Panel</h1>
            </div>

            <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
                {(error || success) && (
                    <div className={error ? "error-message" : "success-message"}>
                        {error || success}
                    </div>
                )}
                <h2>Mushaf pages</h2>
                <p style={{ marginTop: 0, color: "var(--gray-color)", maxWidth: 560 }}>
                    Upload a page image. Surah and Para mapping updates automatically.
                    Page number is optional — leave blank to append as next page.
                </p>
                <form onSubmit={handleMushafUpload} className="mushaf-upload-form">
                    <input
                        type="number"
                        min={1}
                        placeholder="Page # (optional)"
                        value={pageNumber}
                        onChange={(e) => setPageNumber(e.target.value)}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPageFile(e.target.files?.[0] || null)}
                    />
                    <button type="submit" className="btn btn-sm btn-primary" disabled={uploadBusy}>
                        {uploadBusy ? "Working…" : "Upload + auto-map"}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={handleRemap} disabled={uploadBusy}>
                        Rebuild map
                    </button>
                </form>
            </div>

            <div className="admin-card">
                <h2>User Management</h2>

                {loading ? (
                    <div className="loading-state">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <p>No users found</p>
                    </div>
                ) : (
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Verified</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>
                                            {editingUser === user.id ? (
                                                <div className="edit-form">
                                                    <input
                                                        type="text"
                                                        defaultValue={user.firstName}
                                                        id={`firstName-${user.id}`}
                                                        placeholder="First Name"
                                                    />
                                                    <input
                                                        type="text"
                                                        defaultValue={user.lastName}
                                                        id={`lastName-${user.id}`}
                                                        placeholder="Last Name"
                                                    />
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            const firstName = document.getElementById(`firstName-${user.id}`).value;
                                                            const lastName = document.getElementById(`lastName-${user.id}`).value;
                                                            handleEditUser(user.id, firstName, lastName);
                                                        }}
                                                        disabled={actionLoading === `edit-${user.id}`}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => setEditingUser(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                `${user.firstName} ${user.lastName}`
                                            )}
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <select
                                                className="role-select"
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={actionLoading === `role-${user.id}` || user.id === currentUser.id}
                                                title={user.id === currentUser.id ? "Cannot change your own role" : "Change role"}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.isEmailVerified ? 'verified' : 'pending'}`}>
                                                {user.isEmailVerified ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => setEditingUser(user.id)}
                                                    title="Edit user"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={actionLoading === user.id || user.id === currentUser.id}
                                                    title={user.id === currentUser.id ? "Cannot delete yourself" : "Delete user"}
                                                >
                                                    {actionLoading === user.id ? "..." : "Delete"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                .admin-page {
                    padding: 2rem 1rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .admin-card {
                    background: var(--card-bg);
                    border: 2px solid var(--border-color);
                    border-radius: 12px;
                    padding: 2rem;
                }
                .admin-card h2 {
                    margin: 0 0 1.5rem 0;
                    color: var(--secondary-color);
                }
                .mushaf-upload-form {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    align-items: center;
                }
                .mushaf-upload-form input[type="number"] {
                    width: 9rem;
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--bg-color);
                    color: var(--text-color);
                }
                .users-table-container {
                    overflow-x: auto;
                }
                .users-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .users-table th,
                .users-table td {
                    padding: 1rem;
                    text-align: left;
                    border-bottom: 1px solid var(--border-color);
                    vertical-align: middle;
                }
                .users-table th {
                    font-weight: 600;
                    color: var(--secondary-color);
                    background: var(--light-color);
                }
                .users-table tr:hover {
                    background: var(--light-color);
                }
                .role-select {
                    padding: 0.375rem 0.75rem;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--bg-color);
                    color: var(--text-color);
                    font-size: 0.85rem;
                    cursor: pointer;
                }
                .role-select:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .status-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                .status-badge.verified {
                    background: rgba(40, 167, 69, 0.1);
                    color: #28a745;
                }
                .status-badge.pending {
                    background: rgba(255, 193, 7, 0.1);
                    color: #ffc107;
                }
                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }
                .edit-form {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }
                .edit-form input {
                    padding: 0.375rem 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    font-size: 0.85rem;
                    width: 100px;
                }
                .loading-state {
                    text-align: center;
                    padding: 2rem;
                    color: var(--gray-color);
                }
                .btn-sm {
                    padding: 0.375rem 0.75rem;
                    font-size: 0.8rem;
                }
                .btn-outline {
                    background: transparent;
                    border: 1px solid var(--primary-color);
                    color: var(--primary-color);
                    cursor: pointer;
                    border-radius: 4px;
                }
                .btn-outline:hover {
                    background: var(--primary-color);
                    color: white;
                }
                .btn-outline:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .btn-primary {
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .btn-primary:hover {
                    background: var(--primary-dark);
                }
                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default Admin;
