import { Navigate, useLocation } from "react-router-dom";
import useStore from "../store";

const PermissionGuard = ({ children, auth }) => {
  const isLoggedIn = useStore(state => state.isLoggedIn) 
  const location = useLocation() 

  if (auth && !isLoggedIn) {
    return <Navigate to="/login" state={{from: location}} replace />
  }

  if (!auth && isLoggedIn && location.pathname === '/login') {
    return <Navigate to="/" replace />
  }

  return children 
}

export default PermissionGuard