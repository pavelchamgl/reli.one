import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCategory } from "../api/categoryApi";


export const fetchCategories = createAsyncThunk(
    "create/fetchCategories",
    async (_, { rejectWithValue }) => {
        try {
            const res = await getCategory()
            console.log(res)
            return res.data
        } catch (error) {
            return rejectWithValue(error.message)
        }
    }
)


const createGoodsSlice = createSlice({
    name: "create",
    initialState: {
        error: null,
        status: null,
        categories: null,
        categoriesStatus: null,
        childCategoryName: null,
        categoriesStage: [] // Массив для хранения выбранных категорий
    },
    reducers: {
        setChildCategories: (state, action) => {
            state.categories = action.payload;
            state.categoriesStatus = "child";
        },
        setChildCategoryName: (state, action) => {
            state.childCategoryName = action.payload;
        },
        setCategoriesStage: (state, action) => {
            const { stage, category } = action.payload;

            // Удаляем "избыточные" категории, если текущий stage меньше текущей длины массива
            state.categoriesStage = state.categoriesStage.slice(0, stage - 1);

            // Добавляем новую категорию, если её нет
            if (!state.categoriesStage.find((item) => item.id === category.id)) {
                state.categoriesStage.push(category);
            }
        },
        setClearAll: (state, action) => {
            state.categories = null
            state.categoriesStatus = null
            state.childCategoryName = null
        }
    },
    extraReducers: (build) => {
        build.addCase(fetchCategories.fulfilled, (state, action) => {
            state.categories = action.payload;
        });
    }
});

export const { setChildCategories, setChildCategoryName, setCategoriesStage, setClearAll } = createGoodsSlice.actions;

export const { reducer } = createGoodsSlice;
