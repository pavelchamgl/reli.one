import { createAsyncThunk } from '@reduxjs/toolkit'
import { API } from 'share/api/api'
import { validateErrors } from './validateErrors'
import { resetPasswordErrorEmail } from '../types/ResetPasswordSchema'


export const sendEmail = createAsyncThunk<string, string>('send/email', async (email, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI
    const api = new API().apiInstance
    const errors = validateErrors(email)
    if (errors.length) {
        return rejectWithValue(errors)
    }
    try {
        const data = await api.post(`/accounts/password/reset/`, {
            email: email
        })
        if (!data.data) {
            throw new Error()
        }
        
        return data.data
    } catch (e) {
        errors.push(resetPasswordErrorEmail.SERVER_ERROR)
        return rejectWithValue(errors)
    }
})
