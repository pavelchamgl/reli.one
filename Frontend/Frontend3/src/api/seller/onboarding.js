import mainInstance from "..";




export const postSellerType = async (type) => {
    try {
        const res = await mainInstance.post(
            "/sellers/onboarding/seller-type/",
            { seller_type: type }
        );

        return res;
    } catch (error) {
        if (error.response) {
            // Ответ от сервера (401, 403, 400, 500)
            const { status, data } = error.response;

            throw {
                status,
                message: data?.message || "Ошибка сервера",
            };
        }

        if (error.request) {
            // Запрос ушёл, но ответа нет
            throw {
                status: null,
                message: "Сервер недоступен",
            };
        }

        // Любая другая ошибка
        throw {
            status: null,
            message: error.message || "Неизвестная ошибка",
        };
    }
};



export const getOnboardingStatus = async () => {
    try {
        const res = await mainInstance.get("/sellers/onboarding/state/")
        console.log(res);
        // ! выдает 403, как только исправят добью доконца

        return res.data

    } catch (error) {
        console.log(error);

        if (error.response) {
            // Ответ от сервера (401, 403, 400, 500)
            const { status, data } = error.response;

            throw {
                status,
                message: data?.message || "Ошибка сервера",
            };
        }

        if (error.request) {
            // Запрос ушёл, но ответа нет
            throw {
                status: null,
                message: "Сервер недоступен",
            };
        }

        // Любая другая ошибка
        throw {
            status: null,
            message: error.message || "Неизвестная ошибка",
        };


    }
}

export const putOnboardingBank = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/bank/", obj)
        console.log(res);



    } catch (error) {
        console.log(error);

    }
}

export const putPersonalData = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/self-employed/personal/", obj)
        console.log(res);

    } catch (error) {

    }
}

export const putTax = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/self-employed/tax/", obj)
        return res
    } catch (error) {

    }
}

export const putSelfAddress = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/self-employed/address/", obj)
        return res
    } catch (error) {

    }
}

export const putWarehouse = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/warehouse/", obj)
        return res
    } catch (error) {

    }
}

export const putReturnAddress = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/return/", obj)
        return res
    } catch (error) {

    }
}


export const getReviewOnboarding = async () => {
    try {
        const res = await mainInstance.get("/sellers/onboarding/review/")
        console.log(res);

    } catch (error) {

    }
}

export const postSubmitOnboarding = async () => {
    try {
        const res = await mainInstance.post("/sellers/onboarding/submit/")
        return res
    } catch (error) {

    }
}


export const putCompanyInfo = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/company/info/", obj)
        return res
    } catch (error) {

    }
}

export const putRepresentative = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/company/representative/", obj)
        return res
    } catch (error) {

    }
}

export const putCompanyAddress = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/company/address/", obj)
        return res
    } catch (error) {

    }
}
