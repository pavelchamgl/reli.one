import mainInstance from ".";


export const getOrders = async () => {
    try {
        const res = await mainInstance.get("/orders/")
        return res
    } catch (error) {
        throw error
    }
}

export const getDetalOrders = async (id) => {
    try {
        const res = await mainInstance.get(`/orders/${id}/?pk=16`)
        return res
    } catch (error) {
        throw error
    }
}