import { Outlet } from "react-router-dom"
import { useMediaQuery } from "react-responsive"

import { ToastContainer } from "react-toastify"
import SellerHeader from "../Components/Seller/sellerHeader/SellerHeader"
import SellerPageContainer from "../ui/Seller/SellerPageContainer/SellerPageContainer"
import SellerMobNav from "../Components/Seller/sellerMobNav/SellerMobNav"

const SellerPage = () => {
    const isMobile = useMediaQuery({ maxWidth: 500 })
    return (
        <>
            <SellerPageContainer>
                <SellerHeader />
                <Outlet />
            </SellerPageContainer>
            {isMobile && <SellerMobNav />}
            <ToastContainer />
        </>
    )
}

export default SellerPage