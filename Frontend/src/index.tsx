import { createRoot } from 'react-dom/client'
import App from './app/App'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from 'widgets/ErrorBoundary'
import { Suspense } from 'react'
import { Loading } from 'widgets/Loading'
import { LoaderState } from 'share/ui/Loader/ui/Loader'
import 'share/libs/i18next/i18n'
import { ReduxProvider } from 'app/providers/Redux/ui/ReduxProvider'

const root = createRoot(document.getElementById('root'))
root.render(
    <ErrorBoundary>
        <ReduxProvider>
            <BrowserRouter>
                <Suspense fallback={<Loading state ={LoaderState.Primary}/>}>
                    <App/>
                </Suspense>
            </BrowserRouter>
        </ReduxProvider>
    </ErrorBoundary>
)
