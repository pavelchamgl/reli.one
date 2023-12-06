import { type User, type UserScheme } from 'entities/User/models/type/UserSchema'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { TOKEN_COOKIES, USER_COOKIES } from 'share/const/localstorage'
import Cookies from 'js-cookie'

const initialState: UserScheme = {
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        AutoUser (state, action: PayloadAction<User>) {
            Cookies.set(USER_COOKIES, JSON.stringify(action.payload))
            state.authData = action.payload
        },
        reAuth (state) {
            const dataUser = Cookies.get(USER_COOKIES)
            const token = Cookies.get(TOKEN_COOKIES)
            if(dataUser && token) {
                console.log(token)
                state.authData = JSON.parse(dataUser)
                state.token = token
            }
        },
        logout (state) {
            Cookies.remove(USER_COOKIES)
            state.authData = undefined
        }
    }
})

export const { AutoUser, reAuth, logout } = userSlice.actions
export const userReducer = userSlice.reducer
