import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type PasswordSchema } from 'entities/Password/models/types/passwordT'
const initialState: PasswordSchema = {
    password: ''
}

export const passwordSlice = createSlice({
    name: 'password',
    initialState,
    reducers: {
        setPassword (state, action: PayloadAction<string>) {
            state.password = action.payload
        }
    }
})

export const { setPassword } = passwordSlice.actions
export const passwordReducer = passwordSlice.reducer
