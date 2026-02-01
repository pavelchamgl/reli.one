import CreatePassForm from '../../Components/Seller/auth/createPassForm/CreatePassForm'
import FormWrap from '../../ui/Seller/auth/formWrap/FormWrap'

const SellerCreateNewPass = () => {
    return (
        <FormWrap style={{
            height: "100%",
            padding: "44px 0"
        }}>
            <CreatePassForm />
        </FormWrap>
    )
}

export default SellerCreateNewPass