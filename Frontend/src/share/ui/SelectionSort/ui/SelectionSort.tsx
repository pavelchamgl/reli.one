import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from './SelectionSort.module.scss'
import type React from 'react'
import { memo } from 'react'
interface SelectionSortProps {
    classe?: string
    children: React.ReactNode
    onChangeHandler: (e: string) => void
    value: string
}
export const SelectionSort: React.FC<SelectionSortProps> = memo((props: SelectionSortProps) => {
    const { classe, children, onChangeHandler, value } = props
    return (<>
        <select value={value} onChange={(e) => { onChangeHandler(e.target.value) }} className={useClassName({ cls: cls.Select, mode: {}, classes: [cls[classe]] })}>
            {children}
        </select>
    </>)
})
