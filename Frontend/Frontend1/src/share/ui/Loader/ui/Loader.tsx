import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from '../models/Loader.module.scss'

export enum LoaderState {
    Primary = 'ld',
    Secondary = 'lds'
}

interface LoaderProps {
    children?: React.ReactNode
    classe?: string
    state: LoaderState
}

export const Loader: React.FC<LoaderProps> = ({ children, classe, state }: LoaderProps) => {
    return (<>
        <div className= {useClassName({ cls: cls[state], mode: {}, classes: [] })}></div>
    </>)
}
