import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
    postSellerImages,
    postSellerLisence,
    postSellerParameters,
    postSellerProduct,
    postSellerVariants
} from "../api/seller/sellerProduct"
import {
    getSellerCategoryAttributeSchema,
    putSellerProductAttributes,
    putSellerVariantStock
} from "../api/seller/sellerWizard"
import { ErrToast } from "../ui/Toastify";
import {
    buildAttributePayload,
    CATEGORY_SCHEMA_NOT_READY_MESSAGE,
    isCategoryAttributeSchemaReady,
    makeStepResult,
    normalizeVatRate,
    normalizeWarrantyMonths,
    stepSucceeded,
    validateAttributeDraft
} from "../utils/sellerProductWizard";

export const fetchCreateCategoryAttributeSchema = createAsyncThunk(
    "createProdPrev/fetchCreateCategoryAttributeSchema",
    async (categoryId, { rejectWithValue }) => {
        try {
            if (!categoryId) return null;
            return await getSellerCategoryAttributeSchema(categoryId);
        } catch (error) {
            return rejectWithValue(error?.response?.data || error.message || "Unable to load category schema");
        }
    }
);

const runStep = async (step, callback) => {
    try {
        const payload = await callback();
        return makeStepResult(step, "fulfilled", payload);
    } catch (error) {
        return makeStepResult(step, "rejected", error);
    }
};

const shouldRunStep = (state, step) => !stepSucceeded(state.submitStepResults, step);

export const fetchCreateProduct = createAsyncThunk(
    "createProdPrev/fetchCreateProduct",
    async (_, { getState, rejectWithValue }) => {
        const state = getState().create_prev;

        if (!state) {
            return rejectWithValue("Data for the request not found");
        }

        const stepResults = [...(state.submitStepResults || [])];
        let product = state.createdProductId ? { id: state.createdProductId } : null;
        let createdVariants = state.createdVariants || [];

        if (!isCategoryAttributeSchemaReady(state.category, state.attributeSchema, state.attributeSchemaStatus)) {
            return rejectWithValue({
                message: CATEGORY_SCHEMA_NOT_READY_MESSAGE,
                attributeErrors: { schema: CATEGORY_SCHEMA_NOT_READY_MESSAGE },
                stepResults,
            });
        }

        const attributeErrors = validateAttributeDraft(
            state.attributeSchema?.attributes || [],
            state.attributeValues || {}
        );

        if (Object.keys(attributeErrors).length > 0) {
            return rejectWithValue({
                message: "Please fill required category attributes.",
                attributeErrors,
                stepResults,
            });
        }

        if (!product?.id) {
            const productResult = await runStep("base_product", () => postSellerProduct({
                name: state.name,
                product_description: state.product_description,
                barcode: state.barcode,
                article: state.item || String(Date.now()),
                additional_details: state.additional_details,
                country_of_origin: state.country_of_origin,
                warranty_months: normalizeWarrantyMonths(state.warranty_months),
                vat_rate: normalizeVatRate(state.vat_rate),
                is_age_restricted: Boolean(state.is_age),
                category: state.category?.id || null,
            }));

            stepResults.push(productResult);
            if (productResult.status === "rejected" || !productResult.payload?.id) {
                return rejectWithValue({
                    message: productResult.error || "Error while creating the product",
                    stepResults,
                });
            }
            product = productResult.payload;
        }

        const productId = product.id;

        if (!createdVariants.length && shouldRunStep(state, "variants")) {
            const variantsResult = await runStep("variants", () => postSellerVariants(productId, {
                variants: state.variantsMain || [],
                name: state.variantsName || "default",
                fallbackDimensions: {
                    weight: state.weightMain,
                    width: state.widthMain,
                    length: state.lengthMain,
                    height: state.heightMain,
                },
            }));
            stepResults.push(variantsResult);
            if (variantsResult.status === "fulfilled") {
                createdVariants = variantsResult.payload || [];
            }
        }

        if (createdVariants.length && shouldRunStep(state, "stock")) {
            const stockResult = await runStep("stock", async () => {
                const stockResponses = [];
                for (const [index, variant] of createdVariants.entries()) {
                    const draftVariant = state.variantsMain?.[index] || {};
                    const quantity = draftVariant.quantity_in_stock;
                    if (quantity === undefined || quantity === null || quantity === "") {
                        continue;
                    }
                    stockResponses.push(await putSellerVariantStock(productId, variant.id, {
                        quantity_in_stock: Number(quantity),
                    }));
                }
                return stockResponses;
            });
            stepResults.push(stockResult);
        }

        if (shouldRunStep(state, "attributes")) {
            const attributesPayload = buildAttributePayload(
                state.attributeSchema.attributes,
                state.attributeValues || {}
            );
            if (attributesPayload.length) {
                stepResults.push(await runStep(
                    "attributes",
                    () => putSellerProductAttributes(productId, attributesPayload)
                ));
            } else {
                stepResults.push(makeStepResult("attributes", "fulfilled", []));
            }
        }

        if (shouldRunStep(state, "images") && state.images?.length) {
            stepResults.push(await runStep("images", () => postSellerImages(productId, state.images || [])));
        }

        if (shouldRunStep(state, "parameters")) {
            const parameters = [
                ...(state.product_parameters || []),
                { name: "Length", value: state.lengthMain ?? "" },
                { name: "Width", value: state.widthMain ?? "" },
                { name: "Height", value: state.heightMain ?? "" },
                { name: "Weight", value: state.weightMain ?? "" },
            ].filter((item) => item.name && String(item.value ?? "").trim() !== "");

            if (parameters.length) {
                stepResults.push(await runStep("parameters", () => postSellerParameters(productId, parameters)));
            } else {
                stepResults.push(makeStepResult("parameters", "fulfilled", []));
            }
        }

        if (shouldRunStep(state, "license") && state.license_file?.[0]) {
            stepResults.push(await runStep("license", () => postSellerLisence(productId, state.license_file[0])));
        }

        const uniqueStepResults = Object.values(
            stepResults.reduce((acc, result) => {
                acc[result.step] = result;
                return acc;
            }, {})
        );
        const failedSteps = uniqueStepResults.filter((result) => result.status === "rejected");

        return {
            product,
            createdProductId: productId,
            createdVariants,
            stepResults: uniqueStepResults,
            partialSuccess: failedSteps.length > 0,
        };
    }
);

const createProdPrevSlice = createSlice({
    name: "createProdPrev",
    initialState: {
        name: "",
        rating: "1.0",
        total_reviews: 0,
        license_file: [],
        product_description: "",
        lengthMain: "",
        widthMain: "",
        heightMain: "",
        weightMain: "",
        images: [],
        category: null,
        variantsMain: [],
        variantsName: "",
        category_name: "",
        type: "",
        product_parameters: null,
        status: null,
        err: null,
        previewProduct: null,
        item: "",
        barcode: "",
        additional_details: "",
        country_of_origin: "",
        warranty_months: "",
        vat_rate: "",
        is_age: false,
        attributeSchema: null,
        attributeValues: {},
        attributeErrors: {},
        attributeSchemaStatus: "idle",
        submitStepResults: [],
        createdProductId: null,
        createdVariants: [],
        partialSuccess: false,
    },
    reducers: {
        setName: (state, action) => {
            state.name = action.payload.name
        },
        setLength: (state, action) => {
            state.lengthMain = action.payload?.length
        },
        setWidth: (state, action) => {
            state.widthMain = action.payload?.width
        },
        setHeigth: (state, action) => {
            state.heightMain = action.payload?.height
        },
        setWeight: (state, action) => {
            state.weightMain = action.payload?.weight
        },
        setDescription: (state, action) => {
            state.product_description = action.payload
        },
        setCategory: (state, action) => {
            state.category = action?.payload
            state.category_name = action?.payload?.name
            state.attributeValues = {}
            state.attributeErrors = {}
            state.attributeSchema = null
            state.attributeSchemaStatus = "idle"
        },
        setParametersPrev: (state, action) => {
            state.product_parameters = action.payload
        },
        setImages: (state, action) => {
            state.images = action.payload
        },
        setFilesMain: (state, action) => {
            state.filesMain = action.payload
        },
        setVariantsPrev: (state, action) => {
            state.variantsMain = action.payload
            state.price = action?.payload[0]?.price
        },
        deleteImage: (state, action) => {
            state.images = state.images.filter((_, i) => i !== action.payload?.index)
        },
        setVariantsName: (state, action) => {
            state.variantsName = action.payload.name
        },
        addLicense: (state, action) => {
            state.license_file = action.payload
        },
        deleteLicense: (state, action) => {
            state.license_file = state.license_file.filter(item => item.id !== action.payload.id)
        },
        setPreviewProduct: (state, action) => {
            state.previewProduct = action.payload
        },
        setValues: (state, action) => {
            Object.assign(state, action.payload)
        },
        setType: (state, action) => {
            state.type = action.payload.type
        },
        setAttributeValue: (state, action) => {
            const { attributeId, value } = action.payload
            state.attributeValues[attributeId] = value
            delete state.attributeErrors[attributeId]
        },
        setAttributeErrors: (state, action) => {
            state.attributeErrors = action.payload || {}
        },
        clearSubmitState: (state) => {
            state.submitStepResults = []
            state.createdProductId = null
            state.createdVariants = []
            state.partialSuccess = false
            state.err = null
            state.status = null
        },
    },
    extraReducers: build => {
        build
            .addCase(fetchCreateCategoryAttributeSchema.pending, (state) => {
                state.attributeSchemaStatus = "pending"
            })
            .addCase(fetchCreateCategoryAttributeSchema.fulfilled, (state, action) => {
                state.attributeSchemaStatus = "fulfilled"
                state.attributeSchema = action.payload
                state.attributeErrors = {}
            })
            .addCase(fetchCreateCategoryAttributeSchema.rejected, (state, action) => {
                state.attributeSchemaStatus = "rejected"
                state.attributeSchema = null
                state.attributeErrors = { schema: action.payload || "Unable to load category schema" }
            })
            .addCase(fetchCreateProduct.pending, (state) => {
                state.status = "pending"
                state.err = null
            })
            .addCase(fetchCreateProduct.fulfilled, (state, action) => {
                state.status = action.payload.partialSuccess ? "partial_success" : "fulfilled"
                state.err = null
                state.createdProductId = action.payload.createdProductId
                state.createdVariants = action.payload.createdVariants
                state.submitStepResults = action.payload.stepResults
                state.partialSuccess = action.payload.partialSuccess
            })
            .addCase(fetchCreateProduct.rejected, (state, action) => {
                state.status = "rejected"
                state.err = action.payload?.message || action.payload
                if (action.payload?.attributeErrors) {
                    state.attributeErrors = action.payload.attributeErrors
                }
                state.submitStepResults = action.payload?.stepResults || state.submitStepResults
                ErrToast(action.payload?.message || action.payload || "Ошибка при создании продукта")
            })
    }
})

export const {
    addLicense,
    deleteLicense,
    setName,
    setDescription,
    setCategory,
    setParametersPrev,
    setImages,
    setVariantsPrev,
    setLength,
    setWidth,
    setHeigth,
    setWeight,
    setFilesMain,
    deleteImage,
    setVariantsName,
    setPreviewProduct,
    setValues,
    setType,
    setAttributeValue,
    setAttributeErrors,
    clearSubmitState,
} = createProdPrevSlice.actions
export const { reducer } = createProdPrevSlice
