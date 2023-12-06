import logo from '../../Footer/models/imgs/Solopharma.png'
import profile from '../models/img/profile.png'
import shop from '../models/img/shop.png'
import search from '../models/img/search.png'
import cls from '../models/styles/NavBar.module.scss'
import { LinkCustom } from 'share/ui/LinkCustom'
import { StateLink } from 'share/ui/LinkCustom/ui/LinkCustom'
import { LanguageSwitcher } from 'features/LanguageSwitcher'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import { useTranslation } from 'react-i18next'
import { useNavBar } from 'share/libs/useNavBar/useNavBar'
import { ModelLog } from 'features/ModelUser'
import { ProfileSideBar } from 'features/Profile'
import { BurgerNavBar } from 'features/MobileNavBar'
import { memo } from 'react'
import { useSelector } from 'react-redux/es/exports'
import { getStateUser } from 'entities/User/models/selectors/getStateUser/getStateUser'
import { ModelAuto } from 'features/ModelUser/ModelAuto/ModelAuto'
import { PathRouts } from 'app/providers/Routing/lib/Store'

export const NavBar: React.FC = memo(() => {
    const { t } = useTranslation('main')
    const { openModalLogin, OpenModalLogin, CloseModalLogin, openSideBar, HandlerSideBarToggle, OpenModalAuto, CloseModalAuto, openModalAuto } = useNavBar()
    const { authData } = useSelector(getStateUser)
    return (<>
        <div data-testid = 'Navbar' className = {cls.container}>
            <BurgerNavBar/>
            <div className = {cls.logo_container}><img src={logo}/> <h1>{t('Solo')}<span>{t('Pharma')}</span></h1></div>
            <nav className = {cls.navigate_container}>
                <LinkCustom to = {PathRouts.home} state={StateLink.NAVBAR}>{t('Domů')}</LinkCustom>
                <LinkCustom to = {PathRouts.goods} data-testid = 'ButtonNavbar' state={StateLink.NAVBAR}>{t('Zboží')}</LinkCustom>
                <LinkCustom to= {'#'} state={StateLink.NAVBAR}>{t('Velkoobchodník')}</LinkCustom>
                <LinkCustom to= {PathRouts.project} state={StateLink.NAVBAR}>{t('Projekt na klíč')}</LinkCustom>
                <LinkCustom to= {'#'} state={StateLink.NAVBAR}>{t('O společnosti')}</LinkCustom>
            </nav>
            <div className={cls.NavigatePanel}>
                {
                    authData
                        ? <ButtonCustom onClick={HandlerSideBarToggle} state={ButtonCustomState.NAVBARBUTTON}> <img src={profile}/> </ButtonCustom>
                        : <ButtonCustom onClick={OpenModalLogin} state={ButtonCustomState.NAVBARBUTTON}> <img src={profile}/> </ButtonCustom>
                }
                <img className={cls.hideImg} src={search}/>
                <LanguageSwitcher classe={cls.Switcher}/>
                <img  className={cls.hideImg} src={shop}/>
            </div>
        </div>

        {
            authData
                ? openSideBar && <ProfileSideBar HandlerOpen={HandlerSideBarToggle} Open={openSideBar}/>
                : (openModalLogin && <ModelLog OpenModalAuto={OpenModalAuto} isOpen={openModalLogin} close={CloseModalLogin}/>) || (openModalAuto && <ModelAuto OpenLogForm={OpenModalLogin} isOpen={openModalAuto} close={CloseModalAuto}/>)
        }

    </>)
})
