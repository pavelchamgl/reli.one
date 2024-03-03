import cls from '../models/PanelNavBar.module.scss'
import { useClassName } from 'share/libs/useClassName/useClassName'
import {useCallback, useEffect, useRef, useState} from 'react'
import { LanguageSwitcherMobile } from 'features/LanguageSwitcherMobile/ui/LanguageSwitcherMobile'
import { LinkCustom } from 'share/ui/LinkCustom'
import { StateLink } from 'share/ui/LinkCustom/ui/LinkCustom'
import { useTranslation } from 'react-i18next'
import { PathRouts } from 'app/providers/Routing/lib/Store'

interface PanelNavBarProps {
    Open: boolean,
    isOpening: boolean,
    isClosing?: boolean,
}

const PanelNavBar: React.FC<PanelNavBarProps> = (props: PanelNavBarProps) => {
    const [hide, setHide] = useState<boolean>(true)
    const { t } = useTranslation('navbar')

    const {
        Open,
        isOpening,
        isClosing
    } = props

    useEffect(() => {
        if (Open) {
            setHide(false)
        }
    }, [Open])
    if (hide && !Open) {
        return null
    }
    return (<>
        <div className={useClassName({ cls: cls.Container_MobileBar, mode: { [cls.open]: isOpening , [cls.close]: isClosing}, classes: [] })}>
            <hr/>
            <LinkCustom to={PathRouts.home} state={StateLink.LINKMOBILE}>{t('Domů')}</LinkCustom>
            <hr/>
            <LinkCustom to={PathRouts.goods} state={StateLink.LINKMOBILE}>{t('solární panel')}</LinkCustom>
            <hr/>
            <LinkCustom to={PathRouts.goods} state={StateLink.LINKMOBILE}>{t('Měnič')}</LinkCustom>
            <hr/>
            <LinkCustom to={PathRouts.goods} state={StateLink.LINKMOBILE}>{t('Baterie')}</LinkCustom>
            <hr/>
            <LinkCustom to={PathRouts.goods} state={StateLink.LINKMOBILE}>{t('Kabela')}</LinkCustom>
            <hr/>
            <LinkCustom to={PathRouts.goods} state={StateLink.LINKMOBILE}>{t('Konektor')}</LinkCustom>
            <hr/>
            <LinkCustom to={PathRouts.goods} state={StateLink.LINKMOBILE}>{t('Montážní materiály')}</LinkCustom>
            <hr/>
            <LinkCustom to={PathRouts.goods} state={StateLink.LINKMOBILE}>{t('Velkoobchodník')}</LinkCustom>

            <hr/>
            <LinkCustom to={PathRouts.project} state={StateLink.LINKMOBILE}>{t('Projekt na klíč')}</LinkCustom>

            <hr/>
            <LinkCustom to={'#'} state={StateLink.LINKMOBILE}>{t('účet')}</LinkCustom>

            <hr/>
            <LinkCustom to={'#'} state={StateLink.LINKMOBILE}>{t('O společnosti')}</LinkCustom>
            <hr/>
        </div>
    </>)
}
export default PanelNavBar
