import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from '../models/styles/ErrorMessage.module.scss'
import { useTranslation } from 'react-i18next'
import { memo } from 'react'
export const ErrorMessage: React.FC = memo(() => {
    const { t } = useTranslation()
    return (<>
        <div className= {useClassName({ cls: cls.container, mode: {}, classes: [] })}>
            <h1>{t('Jejda! Něco se pokazilo!')}</h1>
        </div>
    </>)
})
