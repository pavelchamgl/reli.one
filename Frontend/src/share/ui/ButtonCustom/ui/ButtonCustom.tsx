import { type ButtonHTMLAttributes, memo } from 'react'
import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from '../models/button.module.scss'

export enum ButtonCustomState {
    RESET = 'reset',
    NAVBARBUTTON = 'NavBarButton',
    BUTTONMODAL = 'buttonModal',
    BUTTONCLOSE = 'ButtonClose',
    BUTTONBURGER = 'ButtonBurger',
    BUTTONEDIT = 'ButtonEdit',
    BUTTONCANCLE = 'ButtonCancle',
    BUTTONPURCHASE = 'ButtonPurchase',
    BUTTONINFO = 'ButtonInfo',
    BUTTONAUTO = 'AutoButton',
    BUTTONBASKET = 'ButtonBasket'
}

interface ButtonCustomProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode
    classes?: string
    mode?: Record<string, boolean>
    state: ButtonCustomState
}
export const ButtonCustom: React.FC<ButtonCustomProps> = memo(({ children, classes, state, mode = {}, ...otherProps }: ButtonCustomProps) => {
    return (<>
        <button className={useClassName({ cls: cls.buttonC, mode: mode, classes: [cls[state], classes] })} {...otherProps}>
            {children}
        </button>
    </>)
})
