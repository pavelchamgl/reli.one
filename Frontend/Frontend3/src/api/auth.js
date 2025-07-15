import axios from "axios";
import { mainInstance } from ".";

export const register = async (obj) => {
    try {
        const res = await mainInstance.post("/accounts/register/customer/", obj)
        return res
    } catch (error) {
        throw error
    }
}

export const login = async (obj) => {
    try {
        const res = await mainInstance.post("/accounts/login/", obj)
        return res
    } catch (error) {
        throw error
    }
}

export const sendOtp = async (obj) => {
    try {
        const res = await mainInstance.post("/accounts/email/otp/resend/", obj)
        return res
    } catch (error) {
        throw error
    }
}

export const passSendOtp = async (obj) => {
    try {
        const res = await mainInstance.post("/accounts/password/reset/otp/send/", obj)
        return res
    } catch (error) {
        throw error
    }
}

export const emailConfirm = async (obj) => {
    try {
        const res = await mainInstance.post("/accounts/email/confirmation/", obj)
        return res
    } catch (error) {
        throw error
    }
}

export const emailPassConfirm = async (obj) => {
    try {
        const res = await mainInstance.post("/accounts/check-otp-password-reset/", obj)
        return res
    } catch (error) {
        throw error
    }
}

export const logout = async (obj) => {
    try {
        const res = await mainInstance.post("/accounts/logout/", obj)
        return res
    } catch (error) {
        throw error
    }
}

export const deleteAccount = async () => {
    try {
        const res = await mainInstance.delete("/accounts/deletion/me/")
        return res
    } catch (error) {
        throw error
    }
}

export const createNewPassApi = async (obj) => {
    try {
        const res = await mainInstance.post("/accounts/password/reset/confirmation/", obj)
        return res
    } catch (error) {
        throw error
    }
}

export const getInfoForG = async (token) => {
    try {
        const data = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        return data
    } catch (error) {
        console.log(error);
    }
}