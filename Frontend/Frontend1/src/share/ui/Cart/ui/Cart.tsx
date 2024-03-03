import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from '../models/cart.module.scss'
import { type HTMLAttributes } from 'react'
export enum CartListState {
    SALECART = 'SaleCart'
}
interface CartProps extends HTMLAttributes<HTMLElement> {
    classe?: string
    state: CartListState
    children?: React.ReactNode
}

export const Cart: React.FC<CartProps> = (props: CartProps) => {
    const { classe, state, children, ...otherProps } = props
    return (<>
        <div {...otherProps} className={useClassName({ cls: cls.Cart, mode: {}, classes: [cls[state], classe] })}>
            {children}
        </div>
    </>)
}
