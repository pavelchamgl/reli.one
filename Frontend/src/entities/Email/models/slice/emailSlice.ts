import { type EmailSchema } from 'entities/Email/models/types/emailSchema'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

const initialState: EmailSchema = {
    email: '',
    error: ''
}

export const emailSlice = createSlice({
    name: 'email',
    initialState,
    reducers: {
        setEmail (state, action: PayloadAction<string>) {
            state.email = action.payload
        }
    }
})

export const { setEmail } = emailSlice.actions
export const emailReducer = emailSlice.reducer
