import { useEffect, useState } from "react";
import facebookIcon from "../../../assets/Auth/facebookIc.svg";

import { useDispatch } from "react-redux";

import styles from "./FacebookAuth.module.scss";
import { facebookLogin } from "../../../api/auth";

const FacebookAuth = ({ setRegErr, setIsLoged, syncBasket }) => {
    const [sdkReady, setSdkReady] = useState(!!window.FB);

    const dispatch = useDispatch()

    useEffect(() => {
        if (window.FB) {
            setSdkReady(true);
            return;
        }

        const interval = setInterval(() => {
            if (window.FB) {
                setSdkReady(true);
                clearInterval(interval);
            }
        }, 300);

        return () => clearInterval(interval);
    }, []);

    const handleFacebookLogin = () => {
        if (!window.FB) return;

        window.FB.login(
            (response) => {
                if (response.authResponse) {
                    facebookLogin(response?.authResponse?.accessToken).then((res) => {
                        if (res.status === 200) {

                            setIsLoged(true)
                            dispatch(syncBasket())
                            localStorage.setItem("token", JSON.stringify(res.data));

                        }
                    }).catch((err) => {
                        setRegErr("Error logging in with Facebook")
                    })


                    // Запрашиваем профиль
                    window.FB.api('/me', { fields: 'name,email,picture' }, function (profile) {
                        localStorage.setItem("email", JSON.stringify(profile.email));

                    });
                } else {
                    console.log("User cancelled login or did not fully authorize.");
                    setRegErr("User cancelled login or did not fully authorize.")
                }
            },
            { scope: 'public_profile,email' }
        );
    };

    return (
        <button onClick={handleFacebookLogin} className={styles.button} disabled={!sdkReady}>
            <img src={facebookIcon} alt="facebook" />
            Facebook
        </button>
    );
};

export default FacebookAuth;
