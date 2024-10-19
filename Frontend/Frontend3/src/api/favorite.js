import { mainInstance } from "./index"

export const toggleFavorite = async (id) => {
    try {
        const res = await mainInstance.post(`/favorites/toggle-favorite/${id}/`)
        return res
    } catch (error) {
        throw error
    }
}

export const getFavoriteProducts = async (page, sort) => {
    try {
        const res = await mainInstance.get(`https://reli.one/api/favorites/products/?page=${page}&sort_by=${sort}&page_size=15`)
        return res
    } catch (error) {
        throw error
    }
}