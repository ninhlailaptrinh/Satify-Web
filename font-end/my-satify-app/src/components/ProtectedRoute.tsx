import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
    adminOnly?: boolean;
}

export default function ProtectedRoute({
                                           children,
                                           adminOnly,
                                       }: ProtectedRouteProps) {
    const token = localStorage.getItem("satify_token");
    const role = localStorage.getItem("satify_role");

    if (!token) return <Navigate to="/login" />;

    if (adminOnly && role !== "admin") return <Navigate to="/" />;

    return <>{children}</>;
}
