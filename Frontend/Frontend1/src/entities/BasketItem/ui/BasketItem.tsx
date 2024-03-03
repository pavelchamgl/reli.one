import { useClassName } from "share/libs/useClassName/useClassName"
import cls from '../models/BasketItem.module.scss'
import item from '../models/imgs/item.png'

export const BasketItem = () => {
    return (<>
        <div className = {useClassName({cls: cls.dFlex, mode:{}, classes: [cls.btop]})}>
            <div>
                <img src={item} alt="" />
            </div>
            <div className={cls.fGrow1}>
                <p>SUNERGY 435w-450w</p>
                <p>SUN 78MD-HFS</p>
            </div>
            <div>
                <p>1 X 150.00 Kč</p>
            </div>
        </div>
    </>)
}