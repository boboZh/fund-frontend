import { Navigate, useLocation } from "react-router-dom";
import useStore from "../store";
import React, { useState, useEffect } from "react";

const PermissionGuard = ({ children, auth }: { children: React.ReactNode; auth: boolean }) => {
  const [isMounted, setIsMounted] = useState(false);

  const isLoggedIn = useStore((state) => state.isLoggedIn);
  const location = useLocation();

  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  if (!isMounted) return <>{children}</>;

  if (auth && !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!auth && isLoggedIn && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PermissionGuard;
