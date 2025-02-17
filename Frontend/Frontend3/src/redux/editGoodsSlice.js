import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getSellerProductById } from "../api/seller/editProduct";
import mainInstance from "../api";


export const fetchSellerProductById = createAsyncThunk(
    "editGoodsSeller/fetchSellerProductById",
    async (id, { rejectWithValue }) => {
        try {
            const res = await getSellerProductById(id)
            console.log(res);

            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const fetchDeleteParameters = createAsyncThunk(
    "editGoodsSeller/fetchDeleteParameters",
    async (obj, { dispatch }) => {
        try {
            const res = await mainInstance.delete(`sellers/products/${obj?.id}/parameters/${obj?.parId}/`)
            dispatch(deleteParameter(obj?.parId))
            return res
        } catch (error) {

        }
    }
)

export const fetchGetImages = createAsyncThunk(
    "editGoodsSeller/fetchGetImages",
    async (id, { rejectWithValue, dispatch }) => {
        try {
            const res = await mainInstance.get(`sellers/products/${id}/images/`)
            if (res.status === 200 && res.data) {
                const newObj = res?.data?.map((item) => {
                    return {
                        ...item,
                        status: "server"
                    }
                })
                dispatch(setImages(newObj))
            }
            console.log(res.data);

        } catch (error) {

        }
    }
)

export const fetchDeleteImage = createAsyncThunk(
    "editGoodsSeller/fetchDeleteImage",
    async (obj, { rejectWithValue, dispatch }) => {
        try {
            const res = await mainInstance(`sellers/products/${obj?.prodId}/images/${obj?.imageId}/`)
            dispatch(deleteImage(obj?.imageId))
        } catch (error) {

        }
    }
)


export const fetchDeleteVariant = createAsyncThunk(
    "editGoodsSeller/fetchDeleteVariant",
    async (obj, { rejectWithValue, dispatch }) => {
        try {
            const res = await mainInstance(`sellers/products/${obj?.prodId}/variants/${obj?.varId}/`)
            dispatch(deleteVariant(obj?.varId))
        } catch (error) {

        }
    }
)

const editGoodsSlice = createSlice({
    name: "editGoodsSeller",
    initialState: {
        id: null,
        product: null,
        parameters: null,
        images: null,
        variantsName: "",
        variantsServ: null,
        name: "",
        rating: "1.0",
        total_reviews: 0,
        license_file: null,
        name: "",
        product_description: "",
        length: "",
        width: "",
        height: "",
        weight: "",
        category: null,
        category_name: "",
        price: ""
        // filesMain: null,

    },
    reducers: {
        setParameter: (state, action) => {
            if (action.payload?.name === "name") {
                return {
                    ...state,
                    name: action.payload.value
                }
            }
            if (action.payload?.name === "desc") {
                return {
                    ...state,
                    product_description: action.payload.value
                }
            }
            if (action.payload?.name === "length") {
                return {
                    ...state,
                    length: action.payload.value
                }
            }
            if (action.payload?.name === "width") {
                return {
                    ...state,
                    width: action.payload.value
                }
            }
            if (action.payload?.name === "weight") {
                return {
                    ...state,
                    weight: action.payload.value
                }
            }
            if (action.payload?.name === "height") {
                return {
                    ...state,
                    height: action.payload.value
                }
            }
            if (action.payload?.name === "varName") {
                return {
                    ...state,
                    variantsName: action.payload.value
                }
            }
        },
        setCategory: (state, action) => {
            return {
                ...state,
                category: action?.payload,
                category_name: action?.payload?.name
            }
        },
        deleteParameter: (state, action) => {




            return {
                ...state,
                parameters: state.parameters.filter((item) => {
                    return item.id !== action.payload
                })
            }
        },
        deleteVariant: (state, action) => {
            return {
                ...state,
                variantsServ: state.variantsServ.filter((item) => {
                    return item.id !== action.payload
                })
            }
        },
        setNewParameters: (state, action) => {
            return {
                ...state,
                parameters: action.payload
            }
        },
        setImages: (state, action) => {
            console.log(action.payload);
            state.images = state.images ? [...state.images, ...action.payload] : [...action.payload];
        },
        deleteImage: (state, action) => {
            return {
                ...state,
                images: state.images(item => item.id !== action.payload.id)
            }
        },
        setNewVariants: (state, action) => {
            return {
                ...state,
                variantsServ: action.payload
            }
        }



    },
    extraReducers: build => {
        build.addCase(fetchSellerProductById.fulfilled, (state, action) => {
            console.log(action.payload);
            if (state.id !== action.payload?.id) {
                state.id = action.payload?.id

                state.name = action.payload?.name
                state.product_description = action.payload?.product_description

                state.product = action.payload,

                    state.parameters = action.payload?.product_parameters
                        ?.filter(item =>
                            item.name !== "length" &&
                            item.name !== "weight" &&
                            item.name !== "width" &&
                            item.name !== "height"
                        )
                        .map(item => ({
                            ...item,
                            status: "server"
                        }));

                state.length = action.payload?.product_parameters?.find((item) => item.name === "length")?.value
                state.weight = action.payload?.product_parameters?.find((item) => item.name === "weight")?.value
                state.width = action.payload?.product_parameters?.find((item) => item.name === "width")?.value
                state.height = action.payload?.product_parameters?.find((item) => item.name === "height")?.value

                state.variantsName = action.payload?.variants ? action.payload.variants[0]?.name : null;
                state.price = action.payload?.variants ? action.payload.variants[0]?.price : null;
                state.variantsServ = action.payload?.variants?.map((item) => {
                    return {
                        ...item,
                        status: "server"
                    }
                })

            }

        })
    }
})


export const { deleteParameter, setNewParameters, setImages, deleteImage, setParameter, setCategory, setNewVariants, deleteVariant } = editGoodsSlice.actions
export const { reducer } = editGoodsSlice