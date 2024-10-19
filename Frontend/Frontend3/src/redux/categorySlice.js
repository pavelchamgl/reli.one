import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getCategory } from "../api/categoryApi"
import { getAllLowestLevelChildren } from "../code/code"


export const fetchGetCategory = createAsyncThunk(
    "category/fetchGetCategory",
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const res = await getCategory()
            const resultArr = getAllLowestLevelChildren(res.data)
            dispatch(setAllCategories(resultArr))
            return res
        } catch (error) {
            return rejectWithValue(error.message)
        }
    }
)

const categorySlice = createSlice({
    name: "category",
    initialState: {
        categories: [],
        category: {},
        podCategory: {},
        allCategories: [],
        err: "",
        status: ""
    },
    reducers: {
        setCategory: (state, action) => {
            return {
                ...state,
                category: action.payload
            }
        },
        setPodCategory: (state, action) => {
            return {
                ...state,
                podCategory: action.payload
            }
        },
        setAllCategories: (state, action) => {
            return {
                ...state,
                allCategories: action.payload
            }
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchGetCategory.pending, (state, action) => {
            state.status = "pending"
        }),
            builder.addCase(fetchGetCategory.fulfilled, (state, action) => {
                state.status = "fulfilled",
                    state.categories = action.payload.data
            }),
            builder.addCase(fetchGetCategory.rejected, (state, action) => {
                state.status = "rejected",
                    state.err = action.payload
            })
    }
})

export const { setCategory, setPodCategory, allCategories, setAllCategories } = categorySlice.actions

export const { reducer } = categorySlice