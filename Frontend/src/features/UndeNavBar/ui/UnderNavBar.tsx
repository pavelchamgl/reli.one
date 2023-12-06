import { LinkCustom } from 'share/ui/LinkCustom'
import { StateLink } from 'share/ui/LinkCustom/ui/LinkCustom'
import cls from '../models/UnderNavBar.module.scss'
import { useClassName } from 'share/libs/useClassName/useClassName'
import { useTranslation } from 'react-i18next'
import { memo } from 'react'

interface UnderNavBarProps {
    state: boolean
}
export const UnderNavBar: React.FC<UnderNavBarProps> = memo(({ state }: UnderNavBarProps) => {
    const { t } = useTranslation()
    return (<>
        <div data-testid = 'UnderNavbar' className={useClassName({ cls: cls.UnderNavbarContainer, mode: { [cls.open]: state }, classes: [] })}>
            <LinkCustom to={'/goods'} state={StateLink.UNDERNAVBAR}>{t('Konektor')}</LinkCustom>
            <LinkCustom to={'/goods'} state={StateLink.UNDERNAVBAR}>{t('Kabela')}</LinkCustom>
            <LinkCustom to={'/goods'} state={StateLink.UNDERNAVBAR}>{t('solární panel')}</LinkCustom>
            <LinkCustom to={'/goods'} state={StateLink.UNDERNAVBAR}>{t('Měnič')}</LinkCustom>
            <LinkCustom to={'/goods'} state={StateLink.UNDERNAVBAR}>{t('Baterie')}</LinkCustom>
            <LinkCustom to={'/goods'} state={StateLink.UNDERNAVBAR}>{t('Montážní materiály')}</LinkCustom>
        </div>
    </>)
})
