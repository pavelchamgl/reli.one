import { useCallback, useState } from 'react'

export const useNavBar = () => {
    const [openModalLogin, setOpenModalLogin] = useState<boolean>(false)
    const [openModalAuto, setOpenModalAuto] = useState<boolean>(false)
    const [openSideBar, setOpenSideBar] = useState<boolean>(false)
    const [openUnderNavBar, setopenUnderNavBar] = useState<boolean>(false)
    const OpenModalLogin = useCallback(() => {
        setOpenModalLogin(true)
    }, [openModalLogin])
    const CloseModalLogin = useCallback(() => {
        setOpenModalLogin(false)
    }, [openModalLogin])

    const OpenModalAuto = useCallback(() => {
        setOpenModalAuto(true)
    }, [openModalLogin])
    const CloseModalAuto = useCallback(() => {
        setOpenModalAuto(false)
    }, [openModalLogin])
    const HandlerSideBarToggle = useCallback(() => {
        setOpenSideBar((prevState) => !prevState)
    }, [openSideBar])
    const HandlerUnderNavBarToggle = useCallback(() => {
        setopenUnderNavBar((prevState) => !prevState)
    }, [openUnderNavBar])

    return {
        OpenModalAuto,
        openModalAuto,
        CloseModalAuto,
        OpenModalLogin,
        openModalLogin,
        CloseModalLogin,
        openSideBar,
        setOpenSideBar,
        HandlerSideBarToggle,
        openUnderNavBar,
        HandlerUnderNavBarToggle
    }
}
