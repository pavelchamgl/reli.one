import { Navigate } from "react-router-dom"
const ProtectedRoute = ({ children }) => {
    const tokenData = JSON.parse(localStorage.getItem("token") || "null")
    if (!tokenData?.access) {
        return <Navigate to="/seller/login" replace />
    }
    return children
}
export default ProtectedRoute
