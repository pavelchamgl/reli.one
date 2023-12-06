import { type AppRouteProps, Store } from '../lib/Store'
import { memo, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Loader } from 'share/ui/Loader'
import { LoaderState } from 'share/ui/Loader/ui/Loader'
import { RequireAuth } from 'app/providers/Routing/ui/privateRout'

export const Routing: React.FC = memo(() => {
    const wrappedComponent = (routs: AppRouteProps) => {
        const element = (<Suspense fallback={<Loader state={LoaderState.Primary}/>}>
            {routs.element}
        </Suspense>)
        return (
            <Route
                key = {routs.path}
                path= {routs.path}
                element= {routs.isAuth ? <RequireAuth> {element} </RequireAuth> : element}
            />
        )
    }
    return (

        <Routes>
            {
                Object.values(Store).map(wrappedComponent)
            }
        </Routes>
    )
})
