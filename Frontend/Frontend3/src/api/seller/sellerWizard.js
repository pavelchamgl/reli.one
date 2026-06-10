import mainInstance from "..";

export const getSellerCategoryAttributeSchema = async (categoryId) => {
    const res = await mainInstance.get(`/sellers/categories/${categoryId}/attribute-schema/`);
    return res.data;
};

export const getSellerProductAttributes = async (productId) => {
    const res = await mainInstance.get(`/sellers/products/${productId}/attributes/`);
    return res.data;
};

export const putSellerProductAttributes = async (productId, payload) => {
    const res = await mainInstance.put(`/sellers/products/${productId}/attributes/`, payload);
    return res.data;
};

export const putSellerVariantStock = async (productId, variantId, payload) => {
    const res = await mainInstance.put(
        `/sellers/products/${productId}/variants/${variantId}/stock/`,
        payload
    );
    return res.data;
};
