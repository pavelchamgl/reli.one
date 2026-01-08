import React from 'react'
import FormWrap from '../../ui/Seller/auth/formWrap/FormWrap'
import VerifyEmail from '../../Components/Seller/auth/createAccount/verifyEmail/VerifyEmail'
import { useMediaQuery } from 'react-responsive'

const CreateVerifyEmail = () => {


    const isMobile = useMediaQuery({ maxWidth: 500 })


    return (
        <FormWrap style={{ height: isMobile ? "100%" : "" }}>
            <VerifyEmail />
        </FormWrap>
    )
}

export default CreateVerifyEmail