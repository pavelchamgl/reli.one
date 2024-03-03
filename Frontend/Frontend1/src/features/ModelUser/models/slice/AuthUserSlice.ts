import { type AuthUserSchema } from '../types/AuthUserSchema'
import { createSlice } from '@reduxjs/toolkit'
import { logUser } from '../actions/logUser'
import { authUser } from '../actions/authUser'
import { userMe } from '../actions/userMe'

const initialState: AuthUserSchema = {
    isLoading: false,
    errorLog: undefined,
    errorAuth: undefined
}

const AuthUserSlice = createSlice({
    name: 'AuthUser',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        builder.addCase(logUser.pending, (state) => {
            state.isLoading = true
        })
        builder.addCase(logUser.fulfilled, (state) => {
            state.isLoading = false
            state.errorLog = undefined
        })
        builder.addCase(logUser.rejected, (state, action) => {
            state.isLoading = false
            state.errorLog = action.payload
        })


        builder.addCase(authUser.pending, (state) => {
            state.isLoading = true
        })
        builder.addCase(authUser.fulfilled, (state) => {
            state.isLoading = false
            state.errorAuth = undefined
        })
        builder.addCase(authUser.rejected, (state, action) => {
            state.isLoading = false
            state.errorAuth = action.payload
        })


        builder.addCase(userMe.pending, (state) => {
            state.isLoading = true
        })
        builder.addCase(userMe.fulfilled, (state) => {
            state.isLoading = false
            state.errorAuth = undefined
        })
        builder.addCase(userMe.rejected, (state) => {
            state.isLoading = false
    
        })
    }
})

export const AuthReducer = AuthUserSlice.reducer
