import { createSlice } from "@reduxjs/toolkit"


const selfEmploedSlice = createSlice({
    name: "selfEmploed",
    initialState: {
        selfData: {

        },
        companyData: {

        },
        registerData: {

        }
    },
    reducers: {
        safeData: (state, action) => {
            state.selfData = {
                ...state.selfData, ...action.payload
            }
        },
        safeCompanyData: (state, action) => {
            console.log(action.payload);

            state.companyData = {
                ...state.companyData, ...action.payload
            }
        },
        setRegisterData: (state, action) => {
            state.registerData = {
                ...state.registerData,
                ...action.payload
            }
        }
    },
    extraReducers: (builder) => {

    }
})

export const { safeData, safeCompanyData, setRegisterData } = selfEmploedSlice.actions
export const { reducer } = selfEmploedSlice