import { HTMLAttributes, memo } from 'react'
import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from '../models/InputCustom.module.scss'

export enum InputState {
    MODALINPUT = 'modalInput',
    RESETINPUT = 'resetInput',
    COMMENTINPUT = 'CommentInput',
    INPUTPAYMENT = 'InputPayment',
    INPUTFORM = 'InputForm'
}
interface InputCustomProps {
    onChange?: (e: string) => void
    value?: string
    children?: React.ReactNode
    classe?: string
    type?: string
    inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
    state: InputState
    placeholder?: string
    readonly?: boolean
}
export const InputCustom: React.FC<InputCustomProps> = memo(({ onChange, value, classe, children, state, type, placeholder, readonly , inputMode}: InputCustomProps) => {
    return (
        <input inputMode= {inputMode} className={useClassName({ cls: cls.InputCustom, mode: {}, classes: [cls[state], classe] })} readOnly={readonly} placeholder={placeholder} type={type} value={value} onChange={(e) => { onChange(e.target.value) } } >{children}</input>
    )
})
