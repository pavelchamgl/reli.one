import { bindActionCreators } from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { useMemo } from "react"

import { safeData } from "../redux/selfEmployed"

const rootActions = {
    safeData
}


// посмотри и поизучай про этот хук пж


export const useActionSafeEmploed = () => {
    const dispatch = useDispatch()
    return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}