import { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import PinInput from 'react-pin-input';

const VerifyPinInput = ({ value, setValue }) => {

    const isMobile = useMediaQuery({ maxWidth: 500 })


    return (
        <PinInput
            length={6}
            initialValue=""
            onChange={(val, index) => {
                console.log(val);

                setValue(val);
            }}
            onComplete={(val => setValue(val))}
            type="numeric"
            inputMode="number"
            inputStyle={
                isMobile
                    ? {
                        border: "1.47px solid #d1d5dc",
                        borderRadius: "10px",
                        width: "34px",
                        height: "39px",
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#101828",
                        marginRight: "5px",
                        fontFamily: "var(--ft)"
                    }
                    : {
                        border: "1.47px solid #d1d5dc",
                        borderRadius: "10px",
                        width: "48px",
                        height: "56px",
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#101828",
                        marginRight: "8px",
                        fontFamily: "var(--ft)"
                    }
            }
            inputFocusStyle={{ borderColor: "#3f7f6d;" }}
            regexCriteria={/^[ A-Za-z0-9_@./#&+-]*$/}
        />
    )
}

export default VerifyPinInput