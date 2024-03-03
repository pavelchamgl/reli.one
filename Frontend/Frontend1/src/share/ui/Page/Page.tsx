import {
    memo, type ReactNode, useRef
} from 'react'
import { useInfiniteScroll } from 'share/libs/useInfiniteScroll/useInfiniteScroll'
import cls from './Page.module.scss'
import { useClassName } from 'share/libs/useClassName/useClassName'

interface PageProps {
    className?: string
    children: ReactNode
    onScrollEnd?: () => void
}

export const Page = memo((props: PageProps) => {
    const { className, children, onScrollEnd } = props
    const wrapperRef = useRef()
    const triggerRef = useRef()

    useInfiniteScroll({
        triggerRef,
        wrapperRef,
        callback: onScrollEnd
    })

    return (
        <section
            ref={wrapperRef}
            className={useClassName({ cls: cls.Page, mode: {}, classes: [className] })}
        >
            {children}
            <div className={cls.triggerPage} ref={triggerRef} />
        </section>
    )
})
