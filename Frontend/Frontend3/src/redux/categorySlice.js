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
            dispatch(setMainCategories(resultArr))
            return res
        } catch (error) {
            return rejectWithValue(error.message)
        }
    }
)

const categoryIds = [
    127, 170, 156, 145, 67, 68, 69, 161
]

const categorySlice = createSlice({
    name: "category",
    initialState: {
        categories: [],
        category: {},
        podCategory: {},
        allCategories: [],
        mainCategories: [],
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
        },
        setMainCategories: (state, action) => {
            return {
                ...state,
                mainCategories: action.payload?.filter((item) => {
                    if (categoryIds.includes(item.id)) {
                        return item

                    }
                })
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

export const { setCategory, setPodCategory, allCategories, setAllCategories, setMainCategories } = categorySlice.actions

export const { reducer } = categorySlice