import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getCategory } from "../api/categoryApi"
import { getAllLowestLevelChildren } from "../code/code"

import i18n from "../../language/i18next";

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

const categoryMap = {
    145: "paintings",
    68: "bodyCare",
    67: "facialCare",
    69: "hairCare",
    156: "healthFoods",
    147: "vitamins",
    170: "sportNutrition",
    161: "puzzles"
};

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
            const t = i18n.getFixedT();


            const itemsCategory = action.payload?.filter((item) =>
                categoryIds.includes(item.id)
            );

            const itemNoCategory = action.payload?.filter((item) =>
                !categoryIds.includes(item.id)
            );

            const translateCategories = (categories) =>
                categories.map((cat) => {
                    const key = categoryMap[cat.id];
                    return {
                        ...cat,
                        originalName: cat.name,                              // оригинал
                        translatedName: key ? t(`categories.${key}`) : cat.name // если ключ есть → переводим, иначе оставляем name
                    };
                });

            return {
                ...state,
                mainCategories: [
                    ...translateCategories(itemsCategory),
                    ...translateCategories(itemNoCategory),
                ],
            };
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