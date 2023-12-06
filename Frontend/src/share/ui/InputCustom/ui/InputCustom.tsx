import { memo } from 'react'
import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from '../models/InputCustom.module.scss'

export enum InputState {
    MODALINPUT = 'modalInput',
    RESETINPUT = 'resetInput',
    COMMENTINPUT = 'CommentInput',
    INPUTPAYMENT = 'InputPayment'
}
interface InputCustomProps {
    onChange?: (e: string) => void
    value?: string
    children?: React.ReactNode
    classe?: string
    type?: string
    state: InputState
    placeholder?: string
    readonly?: boolean
}
export const InputCustom: React.FC<InputCustomProps> = memo(({ onChange, value, classe, children, state, type, placeholder, readonly }: InputCustomProps) => {
    return (
        <input className={useClassName({ cls: cls.InputCustom, mode: {}, classes: [cls[state], classe] })} readOnly={readonly} placeholder={placeholder} type={type} value={value} onChange={(e) => { onChange(e.target.value) } } >{children}</input>
    )
})
