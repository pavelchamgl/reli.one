import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"

import { safeCompanyData, safeData, setRegisterData } from "../redux/selfEmployed"

const rootActions = {
    safeData,
    safeCompanyData,
    setRegisterData
}


// посмотри и поизучай про этот хук пж


export const useActionSafeEmploed = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}