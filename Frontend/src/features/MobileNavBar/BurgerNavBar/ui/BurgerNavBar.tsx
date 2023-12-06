import { Portal } from 'share/ui/Portal'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import {useCallback, useEffect, useRef, useState} from 'react'
import cls from '../models/BurgerMobile.module.scss'
import { AsyncPanelNavBar } from 'features/MobileNavBar/PanelNavBar/ui/AsyncPanelNavBar'
import { useClassName } from 'share/libs/useClassName/useClassName'
const ANIMATION_DELAY = 300
export const BurgerNavBar: React.FC = () => {
    const [open, setOpen] = useState<boolean>(false)
    const [isClosing, setIsClosing] = useState<boolean>(false)
    const [isOpening , setIsOpening] = useState<boolean>(false)
    const current = useRef<ReturnType<typeof setTimeout>>()
    // const HandlerOpen = () => {
    //     setOpen((prevState) => !prevState)
    //     console.log(open)
    //     document.body.classList.toggle(cls.OpenRoot)
    // }

    const HandlerOpen =() => {
        document.body.classList.toggle(cls.OpenRoot)
        setOpen((prevState) => !prevState)
        if ( !open) {
            current.current = setTimeout(() => {
                setIsOpening(true)
            }, ANIMATION_DELAY)
        } else {
               setIsClosing(true)
            current.current = setTimeout(() => {
                setIsClosing(false)
                setIsOpening(false)
            }, ANIMATION_DELAY)
        }
    }


    return (<>
        <div className={cls.BurgerContainer} onClick={HandlerOpen} >
            <ButtonCustom classes={useClassName({ cls: cls.Burger, mode: { [cls.open]: open }, classes: [] })} state={ ButtonCustomState.BUTTONBURGER }/>
        </div>
        <Portal element={document.body}>
            <AsyncPanelNavBar isClosing={isClosing} isOpening={isOpening} Open={open}/>
        </Portal>
    </>)
}
