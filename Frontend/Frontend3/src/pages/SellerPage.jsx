import { Outlet, useLocation } from "react-router-dom"
import { useMediaQuery } from "react-responsive"

import { ToastContainer } from "react-toastify"
import SellerHeader from "../Components/Seller/sellerHeader/SellerHeader"
import SellerPageContainer from "../ui/Seller/SellerPageContainer/SellerPageContainer"
import SellerMobNav from "../Components/Seller/sellerMobNav/SellerMobNav"
import { sellerPathnames } from "../code/seller"
import ScrollToTop from "../Components/ScrollToTop/ScrollToTop"

const SellerPage = () => {
    const isMobile = useMediaQuery({ maxWidth: 500 })

    const { pathname } = useLocation()

    return (
        <>

            {
                sellerPathnames.includes(pathname) ?
                    <>
                        <SellerPageContainer>
                            <SellerHeader />
                        </SellerPageContainer>
                        <Outlet />
                    </> :
                    <SellerPageContainer>
                        <SellerHeader />
                        <Outlet />
                    </SellerPageContainer>
            }

            <ScrollToTop />

            {isMobile && <SellerMobNav />}
            <ToastContainer />
        </>
    )
}

export default SellerPage