import { createSlice } from '@reduxjs/toolkit'
import { fetchProfile } from 'features/Profile/models/actions/fetchProfile'
import { type ErrorsPasswordUpdate, type Profile, type ProfileSchema } from '../types/ProfileType'
import { updatePassword } from '../actions/updatePassword'

const initialState: ProfileSchema = {
    isLoading: undefined,
    errorsPassword: undefined,
    data: undefined
}

const ProfileSlice = createSlice({
    name: 'Profile',
    initialState,
    reducers: {
       
    },
    extraReducers: (builder) => {
        builder.addCase(fetchProfile.pending, (state) => {
            state.isLoading = true
        })
        builder.addCase(fetchProfile.fulfilled, (state, action) => {

            state.isLoading = false
            state.data = action.payload
        })
        builder.addCase(fetchProfile.rejected, (state, action) => {
            state.isLoading = false
            state.errorsPassword = action.payload as ErrorsPasswordUpdate[]
        })

        builder.addCase(updatePassword.pending, (state) => {
            state.isLoading = true
        })
        builder.addCase(updatePassword.fulfilled, (state, action) => {
            state.isLoading = false
            state.errorsPassword = undefined
        })
        builder.addCase(updatePassword.rejected, (state, action) => {
            state.isLoading = false
            state.errorsPassword = action.payload as ErrorsPasswordUpdate[]
        })
    }
})

export const profileReducer = ProfileSlice.reducer

