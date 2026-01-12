import { createSlice } from "@reduxjs/toolkit"


const selfEmploedSlice = createSlice({
    name: "selfEmploed",
    initialState: {
        selfData: {

        }
    },
    reducers: {
        safeData: (state, action) => {
            state.selfData = {
                ...state.selfData, ...action.payload
            }
        }
    },
    extraReducers: (builder) => {

    }
})

export const { safeData } = selfEmploedSlice.actions
export const { reducer } = selfEmploedSlice