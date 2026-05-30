import ApplicationSubmitedContent from '../../Components/Seller/auth/applicationSubmited/ApplicationSubmited'
import FormWrap from '../../ui/Seller/auth/formWrap/FormWrap'
import { useMediaQuery } from 'react-responsive'

const ApplicationSubmited = () => {
    const isMobile = useMediaQuery({ maxWidth: 500 })


    return (
        <FormWrap style={{ height: "100%" }}>
            <ApplicationSubmitedContent />
        </FormWrap>
    )
}

export default ApplicationSubmited