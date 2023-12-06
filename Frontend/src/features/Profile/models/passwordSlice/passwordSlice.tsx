import { createSlice } from '@reduxjs/toolkit'
import { fetchProfile } from 'features/Profile/models/actions/fetchProfile'
import {  type ProfileSchema } from '../types/ProfileType'

export interface PasswordProfileSchema  {
    password?: string
}
const initialState: PasswordProfileSchema = {
    password: undefined
}

const PasswordSlice = createSlice({
    name: 'Password',
    initialState,
    reducers: {
       setPassword(state, action) {
        state.password = action.payload
       }
    },
   
})

export const profilePasswordReducer = PasswordSlice.reducer
export const  { setPassword } = PasswordSlice.actions