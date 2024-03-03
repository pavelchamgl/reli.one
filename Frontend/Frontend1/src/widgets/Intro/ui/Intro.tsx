import cls from '../models/styles/Intro.module.scss'
import { useTranslation } from 'react-i18next'
import { LinkCustom } from 'share/ui/LinkCustom'
import { PathRouts } from 'app/providers/Routing/lib/Store'
import { StateLink } from 'share/ui/LinkCustom/ui/LinkCustom'

export const Intro: React.FC = () => {
    const { t } = useTranslation('main')
    return (<>
        <div className={ cls.IntroContainer }>
            <div className={ cls.BackIntro }>
                <div className={ cls.IntroHeader }>
                    <h1> {t('Spojujeme kupující a')} <span>{t('prodávající z celého světa')}</span>  </h1>
                </div>
            </div>
            <LinkCustom to={PathRouts.project} state={StateLink.LINKINTRO} classes={cls.linkMargin}>{t('Jak Objednat?')}</LinkCustom>
        </div>
    </>)
}
