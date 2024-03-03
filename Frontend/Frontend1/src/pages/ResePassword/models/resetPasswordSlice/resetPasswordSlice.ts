import { resetPasswordErrorPasswordCode, type ResetPasswordSchema, type resetPasswordErrorEmail } from '../types/ResetPasswordSchema'
import { createSlice } from '@reduxjs/toolkit'
import { type PayloadAction } from '@reduxjs/toolkit/dist/createAction'
import { createComment } from 'features/AddComment/models/actions/createComment'
import { sendEmail } from '../actions/sendEmail'
import { SendNewPassword } from '../actions/sendNewPassword'

const initialState: ResetPasswordSchema = {
    isLoading: false,
    errorsEmail: undefined,
    email: undefined,
    password: undefined,
    code: undefined,
    canSend: false,
    errorsPassword: undefined
}

const resetPasswordSlice = createSlice({
    name: 'addComment',
    initialState,
    reducers: {
        setPassword(state, action: PayloadAction<string>) {
            state.password = action.payload
        },
        setEmail(state, action: PayloadAction<string>) {
            state.email = action.payload
        },
        setCode(state, action: PayloadAction<string>) {
            state.code = action.payload
        },
    },
    extraReducers: (builder) => (
        builder.addCase(sendEmail.pending, (state, action) => {
            state.isLoading = true
        }),
        builder.addCase(sendEmail.fulfilled, (state, action) => {
            state.isLoading = false
            state.canSend = true
         
        }),
        builder.addCase(sendEmail.rejected, (state, action) => {
            state.isLoading = false
            state.errorsEmail = action.payload as resetPasswordErrorEmail[]
           
        }),

        builder.addCase(SendNewPassword.pending, (state, action) => {
            state.isLoading = true
        }),
        builder.addCase(SendNewPassword.fulfilled, (state, action) => {
            state.isLoading = false
        }),
        builder.addCase(SendNewPassword.rejected, (state, action) => {
            state.isLoading = false
            state.errorsPassword = action.payload as resetPasswordErrorPasswordCode[]
           
        })
    )
})

export const resetPasswordReducer = resetPasswordSlice.reducer
export const { setCode,setEmail,setPassword } = resetPasswordSlice.actions
