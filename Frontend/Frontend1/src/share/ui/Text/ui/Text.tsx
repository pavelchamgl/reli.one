import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from './Text.module.scss'

enum TextTheme {
    H1 = 'H1',
    H2 = 'H2'

}
interface TextProps {
    children?: string
    theme?: TextTheme
    classe?: string
}
export const Text: React.FC = (props: TextProps) => {
    const {
        children,
        theme,
        classe
    } = props
    return (<>
        <p className={ useClassName({ cls: cls.text, mode: {}, classes: [cls[theme], classe] })}>{children}</p>
    </>)
}
