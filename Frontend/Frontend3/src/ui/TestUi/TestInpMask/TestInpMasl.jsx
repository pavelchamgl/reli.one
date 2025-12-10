import { useState } from "react"
import InputMask from "react-input-mask"

const TestInpMasl = () => {

    const masks = "99.99.9999"

    const [value, setValue] = useState("")

    return (
        <div>
            <InputMask
                mask={masks}
                maskChar=""
                alwaysShowMask={false}
                placeholder="dd.mm.yyyy"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            >
                {(inputProps) => <input {...inputProps} type="tel" />}
            </InputMask>
        </div>
    )
}

export default TestInpMasl