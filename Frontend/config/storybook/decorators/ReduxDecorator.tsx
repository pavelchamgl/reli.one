import {ReduxProvider} from "app/providers/Redux/ui/ReduxProvider";
import {DeepPartial, ReducersMapObject} from "@reduxjs/toolkit";
import {GlobalScheme} from "app/providers/Redux/models/types/ReduxType";
import {AuthReducer} from "features/ModelUser";
import {passwordReducer} from "entities/Password";
import {emailReducer} from "entities/Email";

export interface ReduxDecoratorProps {
    children?: React.ReactNode
    state?: DeepPartial<GlobalScheme>
    asyncReducers?: DeepPartial<ReducersMapObject<GlobalScheme>>
}


export const ReduxDecorator: React.FC<ReduxDecoratorProps> = (props: ReduxDecoratorProps) => {

    const {
        children,
        state,
        asyncReducers
    } = props

    const defaultAsyncReducers: DeepPartial<ReducersMapObject<GlobalScheme>> = {
        auth: AuthReducer,
        password: passwordReducer,
        email: emailReducer
    }

   return (
       <ReduxProvider initialState={state} asyncReducers={{...asyncReducers, ...defaultAsyncReducers }}>
           {children}
       </ReduxProvider>
   )
}
