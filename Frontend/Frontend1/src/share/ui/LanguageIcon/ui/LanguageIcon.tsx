import cls from '../models/styles/LanguageIcont.module.scss'
import { type HTMLAttributes } from 'react'
export enum LanguageIconTheme {
    CZECH = 'cz',
    GERMAN = 'gr',
    ENGLISH = 'en'
}
interface LanguageIconProps extends HTMLAttributes<HTMLDivElement> {
    pathImg: string
    classes?: string
    theme?: LanguageIconTheme
}
export const LanguageIcon: React.FC<LanguageIconProps> = ({ pathImg, classes, theme, ...otherProps }: LanguageIconProps) => {
    return (

        <div className={cls.containerImg} {...otherProps}>
            <img src={pathImg} className={cls.imgC}/>
        </div>

    )
}
