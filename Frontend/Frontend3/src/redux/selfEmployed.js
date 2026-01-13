import { createSlice } from "@reduxjs/toolkit"


const selfEmploedSlice = createSlice({
    name: "selfEmploed",
    initialState: {
        selfData: {

        },
        companyData: {

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
        }
    },
    extraReducers: (builder) => {

    }
})

export const { safeData, safeCompanyData } = selfEmploedSlice.actions
export const { reducer } = selfEmploedSlice