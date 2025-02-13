import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { postSellerParameters, postSellerProduct, postSellerVariants } from "../api/seller/sellerProduct"


export const fetchCreateProduct = createAsyncThunk(
    "createProdPrev/fetchCreateProduct",
    async (_, { getState, rejectWithValue }) => {
        const state = getState().create_prev; // Достаем `createProdPrev`


        console.log(state);


        try {
            // Отправляем запрос на создание продукта
            const res = await postSellerProduct({
                name: state.name,
                product_description: state.product_description,
                category: state.category?.id || null
            });

            const productId = res.data.id;

            // Параллельно отправляем параметры и варианты
            await Promise.all([
                postSellerParameters(productId, state.product_parameters),
                postSellerVariants(productId, {
                    variants: state.variantsMain,
                    name: state.variantsName
                })
            ]);

            return res.data; // Обязательно возвращаем данные
        } catch (error) {
            return rejectWithValue(error.response?.data || "Ошибка при создании продукта");
        }
    }
);



const createProdPrevSlice = createSlice({
    name: "createProdPrev",
    initialState: {
        name: "",
        rating: "1.0",
        total_reviews: 0,
        license_file: null,
        name: "",
        product_description: "",
        lengthMain: "",
        widthMain: "",
        heightMain: "",
        weightMain: "",
        images: "",
        category: null,
        variantsMain: [],
        variantsName: "",
        category_name: "",
        // filesMain: null,
        product_parameters: null,

    },
    reducers: {
        setName: (state, action) => {
            return {
                ...state, name: action.payload.name
            }
        },
        setLength: (state, action) => {
            return {
                ...state,
                lengthMain: action.payload?.length
            }
        },
        setWidth: (state, action) => {
            return {
                ...state,
                widthMain: action.payload?.width
            }
        },
        setHeigth: (state, action) => {
            return {
                ...state,
                heightMain: action.payload?.height
            }
        },
        setWeight: (state, action) => {
            return {
                ...state,
                weightMain: action.payload?.weight
            }
        },
        setDescription: (state, action) => {
            return {
                ...state, product_description: action.payload
            }
        },
        setCategory: (state, action) => {
            return {
                ...state,
                category: action?.payload,
                category_name: action?.payload?.name
            }
        },
        setParametersPrev: (state, action) => {

            return {
                ...state,
                product_parameters: action.payload
            }
        },

        setImages: (state, action) => {
            return {
                ...state,
                images: action.payload
            }
        },
        setFilesMain: (state, action) => {
            return {
                ...state,
                filesMain: action.payload
            }
        },
        setVariantsPrev: (state, action) => {
            return {
                ...state,
                variantsMain: action.payload,
                price: action?.payload[0]?.price
            }
        },
        deleteImage: (state, action) => {
            return {
                ...state,
                images: state.images.filter((_, i) => i !== action.payload?.index)
            }
        },
        setVariantsName: (state, action) => {
            return {
                ...state,
                variantsName: action.payload.name
            }
        }
    },
    extraReducers: build => {

    }
})

export const { setName, setDescription, setCategory, setParametersPrev, setImages, setVariantsPrev, setLength, setWidth, setHeigth, setWeight, setFilesMain, deleteImage, setVariantsName } = createProdPrevSlice.actions
export const { reducer } = createProdPrevSlice