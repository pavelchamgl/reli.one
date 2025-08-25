import { useState } from "react";
import googleIcon from "../../../assets/Auth/googleIc.svg"
import { useGoogleLogin, GoogleLogin } from "@react-oauth/google";
import { getInfoForG, googleLogin } from "../../../api/auth";
import { useDispatch } from "react-redux";
// import jwt_decode from "jwt-decode";


import styles from "./GoogleAuth.module.scss"

const GoogleAuth = ({ setRegErr, setIsLoged, syncBasket }) => {

    const [email, setEmail] = useState("")

    const dispatch = useDispatch()

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {

            getInfoForG(tokenResponse.access_token).then((res) => {
                localStorage.setItem("email", JSON.stringify(res.data?.email));

            });
            googleLogin(tokenResponse.access_token).then((res) => {
                localStorage.setItem("token", JSON.stringify(res.data));
                setIsLoged(true)

                dispatch(syncBasket())

            }).catch((err) => {
                if (err.response) {
                    if (err.response.status === 500) {
                        setRegErr("An error occurred on the server. Please try again later.");
                    } else if (err.response.status === 401) {
                        const errorData = err.response.data;
                        let errorMessage = "";

                        for (const key in errorData) {
                            if (Array.isArray(errorData[key])) {
                                errorMessage += `${key}: ${errorData[key].join(", ")} `;
                            }
                        }

                        setRegErr(
                            errorMessage.trim() ||
                            "No active account found with the given credentials."
                        );
                    } else {
                        setRegErr("An unknown error occurred.");
                    }
                } else {
                    setRegErr("Failed to connect to the server. Check your internet connection.");
                }
            })

        },
    });

    return (
        <button className={styles.button}
            onClick={login}
        >
            <img src={googleIcon} alt="гугл" />
            <p>Google</p>
        </button>
        //   <GoogleLogin
        //   onSuccess={(credentialResponse) => {
        //     console.log(credentialResponse)
        //     console.log("---------------------------------------------");
        //     var decoded = jwt_decode(credentialResponse.credential);
        //     console.log(decoded);

        //   }}
        //   onError={(error) => {
        //     console.log("Login Failed", error);
        //   }}
        // />
    );
};



export default GoogleAuth