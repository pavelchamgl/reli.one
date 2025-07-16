import { useEffect, useState } from "react";
import facebookIcon from "../../../assets/Auth/facebookIc.svg";
import styles from "./FacebookAuth.module.scss";

const FacebookAuth = () => {
    const [sdkReady, setSdkReady] = useState(!!window.FB);

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
                    console.log("Login success:", response);

                    // Запрашиваем профиль
                    window.FB.api('/me', { fields: 'name,email,picture' }, function (profile) {
                        console.log("Profile:", profile);
                    });
                } else {
                    console.log("User cancelled login or did not fully authorize.");
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
