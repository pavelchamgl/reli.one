import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { getUser } from 'entities/User/models/selectors/getUser/getUser'
import { PathRouts } from 'app/providers/Routing/lib/Store'

export function RequireAuth ({ children }: { children: Array<string | JSX.Element> }) {
    const auth = useSelector(getUser)
    const location = useLocation()

    if (!auth) {
        return <Navigate to={PathRouts.home} state={{ from: location }} replace />
    }

    return children
}
