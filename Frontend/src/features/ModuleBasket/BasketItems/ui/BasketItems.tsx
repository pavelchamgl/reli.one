import { useClassName } from "share/libs/useClassName/useClassName"
import cls from './basket.module.scss'
import { BasketItem } from "entities/BasketItem"
import { useTranslation } from "react-i18next"

const BasketItems = () => {
    const {t} = useTranslation('basket')
    return (<>
    <div>
        <div className = {cls.dFlex}>
            <div >
                <p className = {cls.textSilver}>{t('Objednat')} <span>№123121</span></p>
                <p className = {cls.textSilver}>{t('Čas objednávky')}: <span>16:08 20.08.2023</span></p>
            </div>
            <div>
                <p className = {cls.textGreen}>{t('Doručovat budeme do')} 1. listopadu</p>
            </div>
        </div>
    </div>
    <div>
        <BasketItem></BasketItem>
        <BasketItem></BasketItem>
        <BasketItem></BasketItem>
    </div>
    <div className = {cls.btop}>
        <div className = {cls.dFlex}>
            <div >
                <p className = {cls.textSilver}>{t('Mezisoučet')} </p>
            </div>
            <div>
                <p className = {cls.textSilver}>450.00 Kč</p>
            </div>
        </div>
        <div className = {cls.dFlex}>
            <div >
                <p className = {cls.textSilver}>{t('Přeprava')} </p>
            </div>
            <div>
                <p className = {cls.textSilver}>Zdarma</p>
            </div>
        </div>
        <div className = {cls.dFlex}>
            <div >
                <p className = {cls.textSilver}>{t('Propagační kód')} </p>
            </div>
            <div>
                <p className = {cls.textGreen}>-150.00 Kč </p>
            </div>
        </div>
    </div>
    <div className = {cls.btop}>
        <div className = {cls.dFlex}>
            <div >
                <p className = {cls.textSilver}>{t('Celkem')} </p>
            </div>
            <div>
                <p className = {cls.textSilver}>CZK 300.00 Kč</p>
            </div>
        </div>
    </div>
    </>)
}

export default BasketItems