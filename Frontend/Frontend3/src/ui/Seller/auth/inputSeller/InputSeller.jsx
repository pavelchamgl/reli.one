import emailIc from "../../../../assets/Seller/auth/email.svg";
import passIc from "../../../../assets/Seller/auth/password.svg";
import eyeOpIc from "../../../../assets/Seller/auth/eyeOp.svg";
import eyeClIc from "../../../../assets/Seller/auth/eyeCl.svg";

import styles from "./InputSeller.module.scss";
import { useState } from "react";

const InputSeller = ({
    type,
    title,
    img,
    circle,
    required,
    afterText,
    placeholder,
    num,
    error,
    touched,          // ✅ добавили
    ...props
}) => {
    const [inpType, setInpType] = useState(type);

    const showError = Boolean(touched && error); // ✅ ошибка только после touched

    if (type === "email") {
        return (
            <label className={styles.labelWrap}>
                <h5 className={required ? styles.titleRequired : styles.inpTitle}>{title}</h5>

                <div className={`${styles.inpWrap} ${showError ? styles.error : ""}`}
                    style={{ borderRadius: circle ? "16px" : "" }}>
                    <img src={emailIc} alt="" />
                    <input
                        type="email"
                        placeholder={placeholder}
                        style={{ fontFamily: num ? "var(--ft)" : "" }}
                        {...props}
                    />
                </div>

                {showError && <p className={styles.errorText}>{error}</p>}
            </label>
        );
    }

    if (type === "password") {
        return (
            <label className={styles.labelWrap}>
                <h5 className={required ? styles.titleRequired : styles.inpTitle}>{title}</h5>

                <div className={`${styles.inpWrap} ${showError ? styles.error : ""}`}
                    style={{ borderRadius: circle ? "16px" : "" }}>
                    <img src={passIc} alt="" />
                    <input
                        type={inpType}
                        placeholder={placeholder}
                        style={{ fontFamily: num ? "var(--ft)" : "" }}
                        {...props}
                    />
                    <button
                        type="button"
                        onClick={() => setInpType(inpType === "password" ? "text" : "password")}
                    >
                        <img src={inpType === "password" ? eyeClIc : eyeOpIc} alt="" />
                    </button>
                </div>

                {showError && <p className={styles.errorText}>{error}</p>}
            </label>
        );
    }

    return (
        <label className={styles.labelWrap}>
            <h5 className={required ? styles.titleRequired : styles.inpTitle}>{title}</h5>

            <div className={`${styles.inpWrap} ${showError ? styles.error : ""}`}
                style={{ borderRadius: circle ? "16px" : "" }}>
                {img ? <img src={img} alt="" /> : null}
                <input
                    type={type}
                    placeholder={placeholder}
                    style={{ fontFamily: num ? "var(--ft)" : "" }}
                    {...props}
                />
            </div>

            {showError && <p className={styles.errorText}>{error}</p>}
            {afterText && <p className={styles.afterText}>{afterText}</p>}
        </label>
    );
};

export default InputSeller;
