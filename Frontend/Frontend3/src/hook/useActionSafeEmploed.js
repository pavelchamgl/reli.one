import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"

import { getAllCompanyDataBD, getAllDataFromBD, safeCompanyData, safeData, setRegisterData } from "../redux/selfEmployed"

const rootActions = {
    safeData,
    safeCompanyData,
    setRegisterData,
    getAllDataFromBD,
    getAllCompanyDataBD
}


// посмотри и поизучай про этот хук пж


export const useActionSafeEmploed = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}