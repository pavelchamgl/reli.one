import cls from '../models/styles/LanguageSwitcher.module.scss'
import { LanguageIcon } from 'share/ui/LanguageIcon/ui/LanguageIcon'
import { useClassName } from 'share/libs/useClassName/useClassName'
import { useSwitcherLanguage } from 'share/libs/useSwitcherLanguage/useSwitcherLanguage'
import { memo } from 'react'

interface LanguageSwitcherProps {
    classe?: string
}
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = memo((props: LanguageSwitcherProps) => {
    const {
        classe
    } = props
    const { stateSwitcher, SwitchLanguage, Language, onClickSwitcher } = useSwitcherLanguage()
    return (<>
        <div onClick={onClickSwitcher} className={useClassName({ cls: cls.iconContainer, mode: { [cls.open]: stateSwitcher }, classes: [classe] })}>
            {
                Language.map((element) => <LanguageIcon key = {element[0]} onClick={() => { SwitchLanguage(element[1]) }} pathImg={element[0]}/>)
            }
        </div>
    </>)
})
