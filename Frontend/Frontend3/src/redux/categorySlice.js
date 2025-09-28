import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getCategory } from "../api/categoryApi"
import { getAllLowestLevelChildren } from "../code/code"

import i18n from "../../language/i18next";

export const fetchGetCategory = createAsyncThunk(
    "category/fetchGetCategory",
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const res = await getCategory()
            const t = i18n.getFixedT();

            const translateCategories = (categories) =>
                categories.map((cat) => {

                    return {
                        ...cat,
                        originalName: cat.name,                              // оригинал
                        translatedName: cat?.id ? t(`categories.${cat?.id}`, { defaultValue: cat.name }) : cat.name // если ключ есть → переводим, иначе оставляем name
                    };
                });

            const translatedCategory = translateCategories(res.data)


            const resultArr = getAllLowestLevelChildren(res.data)
            dispatch(setAllCategories(resultArr))
            dispatch(setMainCategories(resultArr))
            return translatedCategory
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
            const t = i18n.getFixedT();

            const translateCategories = (categories) =>
                categories.map((cat) => {
                    const translatedChildren = cat.children
                        ? cat.children.map((item) => ({
                            ...item,
                            translatedName: item?.id ? t(`categories.${item?.id}`, { defaultValue: cat.name }) : item.name,
                        }))
                        : undefined; // не добавляем пустой массив

                    return {
                        ...cat,
                        originalName: cat.name,
                        translatedName: cat?.id ? t(`categories.${cat?.id}`, { defaultValue: cat.name }) : cat.name,
                        ...(translatedChildren && { children: translatedChildren }), // добавляем только если есть
                    };
                });


            const translatedChildren = translateCategories(action.payload?.children)
            return {
                ...state,
                category: { ...action.payload, children: translatedChildren }
            }
        },
        setPodCategory: (state, action) => {
            return {
                ...state,
                podCategory: action.payload
            }
        },
        setAllCategories: (state, action) => {
            const t = i18n.getFixedT();

            const translateCategories = (categories) =>
                categories.map((cat) => {

                    return {
                        ...cat,
                        originalName: cat.name,                              // оригинал
                        translatedName: cat?.id ? t(`categories.${cat?.id}`, { defaultValue: cat.name }) : cat.name // если ключ есть → переводим, иначе оставляем name
                    };
                });

            // return {
            //     ...state,
            //     mainCategories: [
            //         ...translateCategories(itemsCategory),
            //         ...translateCategories(itemNoCategory),
            //     ],
            // };

            return {
                ...state,
                allCategories: translateCategories(action.payload)
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
                        translatedName: key ? t(`categories.${key}`,  { defaultValue: cat.name }) : cat.name // если ключ есть → переводим, иначе оставляем name
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
                state.status = "fulfilled"
                state.categories = action.payload
            }),
            builder.addCase(fetchGetCategory.rejected, (state, action) => {
                state.status = "rejected",
                    state.err = action.payload
            })
    }
})

export const { setCategory, setPodCategory, allCategories, setAllCategories, setMainCategories } = categorySlice.actions

export const { reducer } = categorySlice