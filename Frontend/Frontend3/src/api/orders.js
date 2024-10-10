import mainInstance from ".";


export const getOrders = async () => {
    try {
        const res = await mainInstance.get("/orders/?status=closed")
        return res
    } catch (error) {
        throw error
    }
}

export const getOrdersCurrent = async () => {
    try {
        const res = await mainInstance.get("/orders/?status=not_closed ")
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