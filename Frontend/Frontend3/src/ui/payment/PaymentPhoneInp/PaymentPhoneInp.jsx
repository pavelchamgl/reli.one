import InputMask from "react-input-mask"
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { isValidPhone } from "../../../code/validation/validationPayment";
import styles from "../PaymentZipAndPhoneInp/PaymentZipAndPhoneInp.module.scss"

const PaymentPhoneInp = ({ title, err = null, fontNum, formik, ...props }) => {

    const masks = {
        cz: "+420 999 999 999",       // Чехия
        sk: "+421 999 999 999",       // Словакия
        pl: "+48 999 999 999",        // Польша
        at: "+43 999 999 9999",       // Австрия
        hu: "+36 99 999 9999",        // Венгрия
        de: "+49 9999 9999999",       // Германия
        si: "+386 99 999 999",        // Словения
        hr: "+385 99 999 9999",       // Хорватия
        be: "+32 499 99 99 99",       // Бельгия
        dk: "+45 99 99 99 99",        // Дания
        nl: "+31 99 999 9999",        // Нидерланды
        lu: "+352 691 999 999",       // Люксембург
        ee: "+372 9999 9999",         // Эстония
        lt: "+370 699 99 999",        // Литва
        lv: "+371 2 999 9999",        // Латвия
        bg: "+359 999 999 999",       // Болгария
        fr: "+33 9 99 99 99 99",      // Франция
        it: "+39 333 999 9999",       // Италия
        ro: "+40 799 999 999",        // Румыния
        es: "+34 699 999 999",        // Испания
        fi: "+358 44 999 9999",       // Финляндия
        se: "+46 70 999 9999",        // Швеция
        gr: "+30 699 999 9999",       // Греция
        pt: "+351 999 999 999",       // Португалия
        ie: "+353 89 999 9999"        // Ирландия
    };


    const [error, setError] = useState(err);
    const { country } = useSelector((state) => state.payment);

    const isFirstRender = useRef(true);

    useEffect(() => {
        // пропускаем первую проверку
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (props.name === "phone") {
            const isValid = isValidPhone(props.value, country);
            setError(isValid ? "" : "Please enter a valid phone number.");
        } else {
            setError(err)
        }
    }, [props.value, country, err]);

    useEffect(() => {
        if (country) {
            formik.setFieldValue("phone", ""); // очищаем номер при смене страны
        }
    }, [country]);

    return (
        <label className={styles.main}>
            <span>{title}</span>
            <InputMask

                type="text"
                {...props}
                mask={masks[country]}
                maskChar=""
                alwaysShowMask={false}
            >
                {(inpProp) => <input
                    {...inpProp}
                    style={
                        fontNum
                            ? { fontFamily: "var(--ft)", caretColor: "black" }
                            : undefined
                    } type="tel"
                />}
            </InputMask>
            {error && <p className={styles.errText}>{error}</p>}
        </label>
    )
}

export default PaymentPhoneInp