import { useTranslation } from 'react-i18next'
import cls from '../models/styles/Footer.module.scss'
import logo from '../models/imgs/Solopharma.png'
import { LinkCustom } from 'share/ui/LinkCustom'
import { StateLink } from 'share/ui/LinkCustom/ui/LinkCustom'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import {PathRouts} from "app/providers/Routing/lib/Store";

export const Footer: React.FC = () => {
    const { t } = useTranslation('main')
    return (<>
        <div className={cls.Foooter_Container}>
            <div className={cls.Inner_Container}>
                <div className = {cls.logo_container}><img src={logo}/> <h1>{t('Solo')}<span>{t('Pharma')}</span></h1></div>
                <nav className = {cls.Navigate_Container}>
                    <LinkCustom classes={cls.LinkNavigate} to= { PathRouts.home } state={StateLink.NAVBAR}>{t('Domů')}</LinkCustom>
                    <LinkCustom classes={cls.ButtonNavigate} to= { PathRouts.goods }  data-testid = 'ButtonNavbar' state={StateLink.NAVBAR}>{t('Zboží')}</LinkCustom>
                    <LinkCustom classes={cls.LinkNavigate} to= {'#'} state={StateLink.NAVBAR}>{t('Velkoobchodník')}</LinkCustom>
                    <LinkCustom classes={cls.LinkNavigate} to= { PathRouts.project } state={StateLink.NAVBAR}>{t('Projekt na klíč')}</LinkCustom>
                    <LinkCustom classes={cls.LinkNavigate} to= {'#'} state={StateLink.NAVBAR}>{t('O společnosti')}</LinkCustom>
                </nav>
                <div className={cls.Info_Container}>
                    <h1>Solopharma Group, s.r.o</h1>
                    <p>{t('Číslo')}: +420 797 837 856</p>
                    <p>{t('E-mailem')}: oshchepkova.solar@gmail.com</p>
                    <p>{t('Adresa')}: Na Lysinách 551/34, Praha 4 - Hodkovičky, PSČ 147 00</p>
                </div>
            </div>
        </div>
    </>)
}
