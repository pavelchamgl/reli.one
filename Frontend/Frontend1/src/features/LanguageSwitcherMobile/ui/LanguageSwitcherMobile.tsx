import i18n from 'i18next'
import { useState } from 'react'
import { Accordion } from 'share/ui/Accordion'
import { useTranslation } from 'react-i18next'

export const LanguageSwitcherMobile: React.FC = () => {
    enum Languages {
        cz = 'čeština',
        en = 'Angličtina',
        gr = 'Němec',
    }
    const initialLanguage = i18n.language as Languages || Languages.cz
    const [stateLanguage, setStateLanguage] = useState<Languages>(initialLanguage)
    const { t } = useTranslation()
    const SwitchLanguage = (language: Languages): void => {
        console.log(language)
        setStateLanguage(language)
        i18n.changeLanguage(language)
    }
    return (<>
        <div style={{ width: '100%' }} >
            <Accordion childs={ Object.entries(Languages).map(([key, value]) => <div key = { key } style={{ paddingLeft: '20px', marginTop: '20px' }} onClick={ () => { SwitchLanguage(key as Languages) } }>{t(value)}</div>) } order={'Jazyk'}/>
        </div>
    </>)
}
