import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
    // Sample data to demonstrate card UI - replace with your actual data
    const sampleItems = [
        {
            id: 1,
            title: "Getting Started",
            description: "Welcome to your new app! This is a sample card component.",
            icon: "🚀",
        },
        {
            id: 2,
            title: "Features",
            description: "This card can be used for any type of content - items, products, or data.",
            icon: "✨",
        },
        {
            id: 3,
            title: "Customization",
            description: "Edit this page to add your own content and styling.",
            icon: "🎨",
        },
        {
            id: 4,
            title: "Documentation",
            description: "Check the README for more details on how to customize.",
            icon: "📚",
        },
    ];

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="subtitle">Welcome to your app!</p>
                </div>
            </div>

            <div className="dashboard-grid">
                {sampleItems.map((item) => (
                    <Link to={`/item/${item.id}`} key={item.id} className="card">
                        <div className="card-icon">{item.icon}</div>
                        <div className="card-content">
                            <h3 className="card-title">{item.title}</h3>
                            <p className="card-description">{item.description}</p>
                        </div>
                        <span className="card-arrow">→</span>
                    </Link>
                ))}
            </div>

            <div className="dashboard-info">
                <div className="card">
                    <div className="card-content">
                        <h3 className="card-title">Quick Links</h3>
                        <ul className="quick-links">
                            <li><Link to="/profile">My Profile</Link></li>
                            {localStorage.getItem('userRole') === 'admin' && (
                                <li><Link to="/admin">Admin Panel</Link></li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
