import type React from 'react'
import { useState } from 'react'
import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from '../models/Accordion.module.scss'
import { useTranslation } from 'react-i18next'
interface AccordionProps {
    childs: React.ReactNode[]
    order: string
}
export const Accordion: React.FC<AccordionProps> = (props: AccordionProps) => {
    const [open, setOpen] = useState<boolean>(false)
    const { t } = useTranslation()
    const {
        childs,
        order
    } = props
    const HandlerClick = () => {
        setOpen(prevState => !prevState)
    }
    return (<>
        <div onClick={HandlerClick} className={useClassName({ cls: cls.AccordionContainer, mode: { [cls.Open]: open }, classes: [] })}>
            <p>{t(order)}</p>
            {
                childs.map((child) => child)
            }
        </div>
    </>)
}
