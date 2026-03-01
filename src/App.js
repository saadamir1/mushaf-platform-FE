import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";
import './utils/errorHandler'; // Import error handler to ensure it's initialized

const Home = React.lazy(() => import("./pages/Home"));
const PageViewer = React.lazy(() => import("./pages/PageViewer"));
const TopicSearch = React.lazy(() => import("./pages/TopicSearch"));
const Bookmarks = React.lazy(() => import("./pages/Bookmarks"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = React.lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Admin = React.lazy(() => import("./pages/Admin"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<Loader />}>
              <Layout>
                <Routes>
                  {/* Public Quran Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/page/:pageNumber" element={<PageViewer />} />
                  <Route path="/topic-search" element={<TopicSearch />} />
                  
                  {/* Protected User Routes */}
                  <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  
                  {/* Admin Only */}
                  <Route path="/admin" element={<PrivateRoute adminOnly={true}><Admin /></PrivateRoute>} />
                  
                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  
                  {/* 404 */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Layout>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
