import { Provider } from 'react-redux'
import { ReduxSetUp } from 'app/providers/Redux/store/store'
import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { type DeepPartial, type ReducersMapObject } from '@reduxjs/toolkit'

interface ReduxProviderProps {
    children: React.ReactNode
    initialState?: DeepPartial<GlobalScheme>
    asyncReducers?: DeepPartial<ReducersMapObject<GlobalScheme>>
}

export const ReduxProvider: React.FC<ReduxProviderProps> = (props: ReduxProviderProps) => {
    const {
        initialState,
        asyncReducers,
        children
    } = props
    const store = ReduxSetUp(
        initialState as GlobalScheme,
        asyncReducers as ReducersMapObject<GlobalScheme>
    )
    return (<>
        <Provider store={store}>
            {children}
        </Provider>
    </>)
}
