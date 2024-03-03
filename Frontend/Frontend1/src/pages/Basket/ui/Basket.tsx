import { useClassName } from "share/libs/useClassName/useClassName"
import { ButtonCustom } from "share/ui/ButtonCustom"
import cls from './Basket.module.scss'
import { ButtonCustomState } from "share/ui/ButtonCustom/ui/ButtonCustom"
import { useCallback, useState } from "react"
import { BasketHistory, BasketItems } from "features/ModuleBasket"
import { useTranslation } from "react-i18next"
const Basket = () => {
  const {t} = useTranslation('basket')
    const [basketState, setBasketState] = useState<boolean>(true)
    const clickHandler = useCallback(() => {
         setBasketState( (prevState) =>  
           !prevState
         )
    },[basketState])
    console.log(cls.Active)
    return (<>
    <div className = {cls.miniContainer}>
        <h1 className = {cls.title}>{t('Moje objednávky')}</h1>
        <ButtonCustom onClick={clickHandler} state={ButtonCustomState.BUTTONBASKET} mode={{ [cls['Active']] : basketState}}>{t('Aktuální')}</ButtonCustom>
        <ButtonCustom onClick={clickHandler} state={ButtonCustomState.BUTTONBASKET} mode={{ [cls['Active']] : !basketState}}>{t('Historie')}</ButtonCustom>
         {
          basketState? <BasketItems/> : <BasketHistory/>
         }
    </div>
    </>)
}
export default Basket