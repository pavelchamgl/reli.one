import { memo } from 'react'
import cls from './Comment.module.scss'
interface CommentProps {
    userName: string
    body: string
}
export const Comment: React.FC<CommentProps> = memo((props: CommentProps) => {
    const {
        userName,
        body
    } = props
    return (<>
        <div className={cls.innerComment}>
            <p>{userName}</p>
            <p><span>{body}</span></p>
        </div>
    </>)
})
