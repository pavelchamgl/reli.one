import mainInstance from ".."


export const getOrders = async () => {
    try {
        const res = await mainInstance.get("sellers/orders/?courier_service=2")
        return res
    } catch (error) {

    }
}

export const getOrderDetails = async (id) => {
    try {
        const res = await mainInstance.get(`sellers/orders/${id}/`)
        return res
    } catch (error) {

    }
}

export const postOrderConfirm = async (id) => {
    try {
        const res = await mainInstance.post(`sellers/orders/${id}/confirm/`)
        return res
    } catch (error) {
        console.log(error);
        throw error
    }
}

export const postOrderShipped = async (id) => {
    try {
        const res = await mainInstance.post(`sellers/orders/${id}/mark-shipped/`)
        return res
    } catch (error) {
        console.log(error);
        throw error
    }
}

export const getLabels = async (id) => {
    try {
        const res = await mainInstance.get(`sellers/orders/${id}/labels/`, {
            responseType: "blob", // важно для получения файла
        });
        return res;
    } catch (error) {
        console.error("Ошибка при получении метки:", error);
        throw error;
    }
};

export const postCencelOrder = async (id) => {
    try {
        const res = await mainInstance.post(`sellers/orders/${id}/cancel/`)
        return res
    } catch (error) {
        console.log(error);
        throw error
    }
}

export const getShipmentLabel = async (id) => {
    try {
        const res = await mainInstance.get(`sellers/orders/shipments/${id}/label/`, {
            responseType: "blob"
        })
        return res
    } catch (error) {
        console.log(error);
        throw error
    }
}


export const postDownloadLabels = async (arr) => {
    try {
        const res = await mainInstance.post(
            'sellers/orders/labels/',
            { order_ids: arr },           // ← просто массив
            {
                responseType: 'blob'      // ← здесь правильное место
            }
        );
        return res;
    } catch (error) {
        console.error(error);
        throw error;
    }
};