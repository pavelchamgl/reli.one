import mainInstance from "..";

export const getOnbordStatus = async () => {
    try {
        const res = await mainInstance.get('/sellers/onboarding/state/')
        return res
    } catch (error) {
        throw error
    }
}