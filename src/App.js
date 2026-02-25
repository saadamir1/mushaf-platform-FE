import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";

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
                  <Route path="/" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/admin" element={<PrivateRoute adminOnly={true}><Admin /></PrivateRoute>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
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
