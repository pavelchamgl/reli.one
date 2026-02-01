
import FormWrap from '../../ui/Seller/auth/formWrap/FormWrap'
import LoginForm from '../../Components/Seller/auth/loginForm/LoginForm'

const SellerLogin = () => {
    return (
        <FormWrap style={{
            height: "100%",
            padding: "44px 0"
        }}>
            <LoginForm />
        </FormWrap>
    )
}

export default SellerLogin