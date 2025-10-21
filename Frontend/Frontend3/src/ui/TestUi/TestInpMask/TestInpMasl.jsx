import { useState } from "react"
import InputMask from "react-input-mask"

const TestInpMasl = () => {

    const masks = {
        cz: "+420 9999999",
        kg: "+996 000 000000"
    }

    const [value, setValue] = useState("")

    return (
        <div>
            <InputMask
                mask={masks["cz"]}
                maskChar=""
                alwaysShowMask={false}
                placeholder="your number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            >
                {(inputProps) => <input {...inputProps} type="tel" />}
            </InputMask>
        </div>
    )
}

export default TestInpMasl