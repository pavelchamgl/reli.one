import mainInstance from ".."

export const getPersonalData = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/self-employed/personal/')
        return res.data
    } catch (error) {
        throw error
    }
}

export const getTaxData = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/self-employed/tax/')
        return res.data
    } catch (error) {
        throw error
    }
}

export const getSelfAddressData = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/self-employed/address/')
        return res.data
    } catch (error) {
        throw error
    }
}

export const getBankData = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/bank/')
        return res.data
    } catch (error) {
        throw error
    }
}

export const getWarehouseData = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/warehouse/')
        return res.data
    } catch (error) {
        throw error
    }
}

export const getReturnData = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/return/')
        return res.data
    } catch (error) {
        throw error
    }
}

export const getDocumentsData = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/documents/')
        return res.data
    } catch (error) {
        throw error
    }
}

export const getCompanyInfo = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/company/info/')
        return res.data
    } catch (error) {
        throw error
    }
}

export const getRepresentativeData = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/company/representative/')
        return res.data
    } catch (error) {
        throw error
    }
}

export const getCompanyAddress = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/company/address/')
        return res.data
    } catch (error) {
        throw error
    }
}