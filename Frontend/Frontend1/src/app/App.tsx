import { Routing } from './providers/Routing/ui/Routing'
import './styles/index.scss'
import { NavBar } from 'widgets/NavBar'
import { useEffect } from 'react'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { reAuth } from 'entities/User'
import { Footer } from 'widgets/Footer'

const App: React.FC = () => {
    const dispatch = useAppDispatch()
    useEffect(() => {
        dispatch(reAuth())
        fetch('/aps', { method: 'POST'})
    }, [])
    return (<>
        <div>
            <NavBar/>
            <Routing/>
            <Footer/>
        </div>
    </>)
}
export default App
