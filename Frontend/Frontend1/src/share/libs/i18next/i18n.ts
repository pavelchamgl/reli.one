import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from '../../../../public/locales/en/translation.json'
import cz from '../../../../public/locales/cz/translation.json'
import gr from '../../../../public/locales/gr/translation.json'

import EnModal from '../../../../public/locales/en/modal.json'
import CzModal from '../../../../public/locales/cz/modal.json'
import GrModal from '../../../../public/locales/gr/modal.json'

import CZProfile from '../../../../public/locales/cz/profile.json'
import EnProfile from '../../../../public/locales/en/profile.json'
import GrProfile from '../../../../public/locales/gr/profile.json'

import NavBarCZ from '../../../../public/locales/cz/NavBarMobile.json'
import NavBarEN from '../../../../public/locales/en/NavBarMobile.json'
import NavBarGR from '../../../../public/locales/gr/NavBarMobile.json'

import GoodsCz from '../../../../public/locales/cz/goods.json'
import GoodsEn from '../../../../public/locales/en/goods.json'
import GoodsGr from '../../../../public/locales/gr/goods.json'

import BasketCz from '../../../../public/locales/cz/basket.json'
import BasketEn from '../../../../public/locales/en/basket.json'
import BasketGr from '../../../../public/locales/gr/basket.json'


import ResetCz from '../../../../public/locales/cz/reset.json'
import ResetEn from '../../../../public/locales/en/reset.json'
import ResetGr from '../../../../public/locales/gr/reset.json'
const resources = {
    en: {
        main: en,
        modal: EnModal,
        profile: EnProfile,
        navbar: NavBarEN,
        goods: GoodsEn,
        basket: BasketEn,
        reset: ResetEn
    },
    cz: {
        main: cz,
        modal: CzModal,
        profile: CZProfile,
        navbar: NavBarCZ,
        goods: GoodsCz,
        basket: BasketCz,
        reset: ResetCz
    },
    gr: {
        main: gr,
        modal: GrModal,
        profile: GrProfile,
        navbar: NavBarGR,
        goods: GoodsGr,
        basket: BasketGr,
        reset: ResetGr
    }
}
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        debug: __IS_DEV__,
        interpolation: {
            escapeValue: false
        },
        react: {
            useSuspense: true
        }
    })

export default i18n
