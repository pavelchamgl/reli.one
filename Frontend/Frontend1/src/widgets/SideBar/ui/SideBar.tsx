import cls from '../models/styles/SideBar.module.scss'
import { useClassName } from 'share/libs/useClassName/useClassName'
import { Portal } from 'share/ui/Portal'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ButtonCustom, ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'

interface SideBarProps {
    Open: boolean
    setOpen: () => void
    children?: React.ReactNode
    lazy?: boolean
}
const ANIMATION_DELAY_CLOSE = 300
const ANIMATION_DELAY_OPENING = 100
export const SideBar: React.FC<SideBarProps> = (props: SideBarProps) => {
    const [hide, setHide] = useState<boolean>(true)
    const [isClosing, setIsClosing] = useState<boolean>(false)
    const [isOpening , setIsOpening] = useState<boolean>(false)
    const current = useRef<ReturnType<typeof setTimeout>>()
    const {
        Open,
        setOpen,
        lazy,
        children
    } = props
    const Closing = useCallback(() => {
        setIsClosing(true)
        current.current = setTimeout(() => {
            setIsClosing(false)
            setIsOpening(false)
            setOpen()
        }, ANIMATION_DELAY_CLOSE)
    }, [])

     useEffect(() => {
        current.current = setTimeout(() => {
            setIsOpening(true)
        },ANIMATION_DELAY_OPENING)
    }, [])


    useEffect(() => {
        if (Open) {
            setHide(false)
        }
    }, [Open])
    if (lazy && hide) {
        return null
    }
    return (
        <Portal element={document.body}>
            <div className={ useClassName({ cls: cls.SideBar, mode: { [cls.OpenOuter]: isOpening, [cls.closing]: isClosing }, classes: [] }) }>
                <div className={ useClassName({ cls: cls.SideBarContainer, mode: { [cls.OpenInner]: isOpening, [cls.closing]: isClosing }, classes: [] }) } >
                    <ButtonCustom onClick={Closing} state={ButtonCustomState.BUTTONCLOSE}/>
                    {children}
                </div>
            </div>
        </Portal>
    )
}
