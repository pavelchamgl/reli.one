import { Link } from 'react-router-dom'
import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from '../models/LinkCustom.module.scss'
export enum StateLink {
    NAVBAR = 'NavBar',
    UNDERNAVBAR = 'UnderNavBar',
    LINKINTRO = 'LinkIntro',
    LINKRESET = 'reset',
    LINKMOBILE = 'LinkMobile'
}
interface LinkCustomProps {
    classes?: string
    children?: React.ReactNode
    onClick?: () => void
    to: string
    state: StateLink
}
export const LinkCustom: React.FC<LinkCustomProps> = ({ children, classes, to, state, onClick }: LinkCustomProps) => {
    return (<>
        <Link onClick={onClick} to = {to} className = {useClassName({ cls: cls.link, mode: {}, classes: [cls[state], classes] })}>
            {children}
        </Link>

    </>)
}
