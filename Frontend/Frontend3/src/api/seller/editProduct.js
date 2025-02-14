import mainInstance from "..";

export const getSellerProductById = async (id) => {
    try {
        const res = mainInstance.get(`sellers/products/${id}/`)
        return res
    } catch (error) {
        throw error
    }
}