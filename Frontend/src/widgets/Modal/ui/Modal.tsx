import cls from '../models/modal.module.scss'
import { useClassName } from 'share/libs/useClassName/useClassName'
import { useCallback, useEffect, useRef, useState } from 'react'

interface ModalProps {
    isOpen: boolean
    children?: React.ReactNode
    close: () => void
    lazy?: boolean
    zIndex?: number

}
const ANIMATION_DELAY = 300
const ANIMATION_DELAY_OPENING = 100
export const Modal: React.FC<ModalProps> = ({ isOpen, children, close, lazy, zIndex }: ModalProps) => {
    const [isClosing, setIsClosing] = useState<boolean>(false)
    const [isOpening, setIsOpening] = useState<boolean>(false)
    const [hide, setHide] = useState<boolean>(true)
    const current = useRef<ReturnType<typeof setTimeout>>()
    const Closing = useCallback(() => {
        setIsClosing(true)
        current.current = setTimeout(() => {
            close()
            setIsClosing(false)
            setIsOpening(false)
        }, ANIMATION_DELAY)

    }, [isClosing])
    useEffect(() => {
        current.current = setTimeout(() => {
            setIsOpening(true)
        },ANIMATION_DELAY_OPENING)
        return () => {
            clearTimeout(current.current)
        }
    }, [])

    useEffect(() => {
        if (isOpen && lazy) {
            setHide(false)
        }
    }, [isOpen])

    if (lazy && hide) {
        return null
    }
    return (<>
        <div style={{zIndex:zIndex }} className={useClassName({ cls: cls.Modal, mode: { [cls.open]: isOpening, [cls.close]: isClosing }, classes: [] })}>
            <div onClick={ Closing } className={cls.Back_container}>
                <div onClick={(e) => { e.stopPropagation() } } className={cls.Content_container}>
                    {children}
                </div>
            </div>
        </div>
    </>)
}
