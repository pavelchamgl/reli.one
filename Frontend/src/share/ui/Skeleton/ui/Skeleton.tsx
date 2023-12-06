import { useClassName } from 'share/libs/useClassName/useClassName'
import cls from '../models/skeleton.module.scss'
import { type CSSProperties, memo } from 'react'

export enum SkeletonState {
    V1 = 'v1',
    V2 = 'v2'
}
interface SkeletonProps {
    height: string | number
    width: string | number
    border: string | number
    marginTop?: string | number
    state: SkeletonState
}
export const Skeleton: React.FC<SkeletonProps> = memo((props: SkeletonProps) => {
    const {
        height,
        width,
        border,
        marginTop,
        state
    } = props
    const style: CSSProperties = {
        height,
        width,
        borderRadius: border,
        marginTop
    }
    return (<>
        <div className={useClassName({ cls: cls.ContainerSkeleton, mode: {}, classes: [cls[state]] })}>
            <div style={style} className={useClassName({ cls: cls.Skeleton, mode: {}, classes: [] })}/>
        </div>
    </>)
})
