import { createSlice } from "@reduxjs/toolkit"

const readTokenFromStorage = () => {
    try {
        return JSON.parse(localStorage.getItem("token") || "null")
    } catch {
        return null
    }
}

const authSlice = createSlice({
    name: "auth",
    initialState: {
        token: readTokenFromStorage(),
    },
    reducers: {
        setToken(state, action) {
            state.token = action.payload
        },
        clearToken(state) {
            state.token = null
        },
    },
})

export const { setToken, clearToken } = authSlice.actions
export const { reducer } = authSlice
