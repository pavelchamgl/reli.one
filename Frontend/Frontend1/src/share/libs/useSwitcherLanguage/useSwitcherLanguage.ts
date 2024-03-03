import { useMemo, useState } from 'react'
import { LanguageIconTheme } from 'share/ui/LanguageIcon/ui/LanguageIcon'
import czech from 'features/LanguageSwitcher/models/imgs/chex.png'
import german from 'features/LanguageSwitcher/models/imgs/german.png'
import english from 'features/LanguageSwitcher/models/imgs/english.png'
import { useTranslation } from 'react-i18next'

export const useSwitcherLanguage = () => {
    const { i18n } = useTranslation()
    const initialLanguage = i18n.language as LanguageIconTheme || LanguageIconTheme.CZECH
    const [stateTheme, setStateTheme] = useState<LanguageIconTheme>(initialLanguage)
    const [stateSwitcher, setStateSwitcher] = useState<boolean>(false)
    const Languages: Record<string, LanguageIconTheme> = {
        [czech]: LanguageIconTheme.CZECH,
        [german]: LanguageIconTheme.GERMAN,
        [english]: LanguageIconTheme.ENGLISH
    }
    const Language = useMemo(() => {
        return [...Object.entries(Languages).filter((element) => element[1] === stateTheme),
            ...Object.entries(Languages).filter((element) => element[1] !== stateTheme)
        ]
    }, [stateTheme])

    const onClickSwitcher = (): void => {
        setStateSwitcher((prevState) => !prevState)
    }
    const SwitchLanguage = (language: LanguageIconTheme): void => {
        setStateTheme(language)
        i18n.changeLanguage(language)
    }

    return {
        SwitchLanguage,
        stateSwitcher,
        Language,
        onClickSwitcher
    }
}
