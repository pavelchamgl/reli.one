import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom"

const ProtectedRoute = ({ children }) => {
    const token = useSelector((state) => state.auth.token)
    if (!token?.access) {
        return <Navigate to="/seller/login" replace />
    }
    return children
}

export default ProtectedRoute
