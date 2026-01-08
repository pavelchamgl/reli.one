import { useMediaQuery } from "react-responsive"

import FormWrap from '../../ui/Seller/auth/formWrap/FormWrap'
import SellerTypeContent from '../../Components/Seller/auth/sellerTypeContent/SellerTypeContent'


const SellerType = () => {

    const isPlanshet = useMediaQuery({ maxWidth: 700 })

    return (
        <FormWrap style={{
            height: isPlanshet ? "100%" : "",
            padding: isPlanshet ? "20px 16px" : ""
        }}>
            <SellerTypeContent />
        </FormWrap>
    )
}

export default SellerType