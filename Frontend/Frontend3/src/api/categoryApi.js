import { getApi } from "./index"


export const getCategory = async () => {
    try {
        const res = await getApi("/products/category/")
        return res
    } catch (error) {
        throw error
    }
}