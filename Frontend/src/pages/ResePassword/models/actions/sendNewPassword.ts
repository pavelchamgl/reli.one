import { createAsyncThunk } from '@reduxjs/toolkit'
import { API } from 'share/api/api'
import { resetPasswordErrorPasswordCode, sendNewPassword } from '../types/ResetPasswordSchema'
import { validateErrorsSend } from './validateErrorsSend'

export const SendNewPassword = createAsyncThunk<string, sendNewPassword>('send/newPassword', async (payload, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI
    const api = new API().apiInstance
    const errors = validateErrorsSend(payload)
    if (errors.length) {
        return rejectWithValue(errors)
    }
    try {
        const data = await api.post(`accounts/password/reset/verified/`, {
            code: payload.code,
            password: payload.password
        })
        if (!data.data) {
            throw new Error()
        }
        payload.navigate('/')
        return data.data
    } catch (e) {
        errors.push(resetPasswordErrorPasswordCode.SERVER_ERROR)
        return rejectWithValue(errors)
    }
})