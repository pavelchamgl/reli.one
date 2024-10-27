import mainInstance, { postApi, getApi } from ".";


export const getComments = async (id, page) => {
    try {
        const res = await getApi(`https://reli.one/api/reviews/${id}/product/?page=${page}&product_id=${id}&page_size=5`)
        return res
    } catch (error) {
        throw error
    }
}


export const postComment = async (id, obj) => {
    try {
        const res = await mainInstance.post(`/reviews/${id}/create/`, obj)
        return res
    } catch (error) {
        throw error
    }
}