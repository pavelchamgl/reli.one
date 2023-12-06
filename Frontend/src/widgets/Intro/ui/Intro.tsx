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
                    <h1> {t('Udržte s námi')} <span>{t('ekologii a ušetřete')}</span>  </h1>
                </div>
            </div>
            <LinkCustom to={PathRouts.project} state={StateLink.LINKINTRO} classes={cls.linkMargin}>{t('Jad Objednat?')}</LinkCustom>
        </div>
    </>)
}
