import { memo, useEffect } from 'react'
import cls from './CommentBlock.module.scss'
import { Comment } from '../Comment/Comment'
import { useSelector } from 'react-redux'
import { getComments, getLodingComment } from '../index'
import { fetchComments } from '../models/actions/fetchComments'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { Skeleton, SkeletonState } from 'share/ui/Skeleton'
import { AddComment } from 'features/AddComment'
import { useTranslation } from 'react-i18next'

interface CommentBlockProps {
    id: string
}
export const CommentBlock: React.FC<CommentBlockProps> = memo((props: CommentBlockProps) => {
    const com = useSelector(getComments.selectAll)
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const isLoading = useSelector(getLodingComment)
    const {
        id
    } = props
    useEffect(() => {
        dispatch(fetchComments(id))
    }, [])
    if (isLoading) {
        return (<>
            <Skeleton state={SkeletonState.V1} height={'500px'} width={'100%'} border={'20px'}/>
            <Skeleton state={SkeletonState.V1} height={'300px'} width={'100%'} border={'20px'} marginTop={'20px'}/>
        </>)
    }
    return (<>
        <div className={cls.CommentsContainer}>
            <h2>{t('Komentáře')}</h2>
            <AddComment/>
            <div className={cls.InnerCommentsContainer}>
                {
                    com.map((elem) => <Comment key = { elem.id } userName={elem.user?.first_name} body={elem?.content}/>)
                }
            </div>
        </div>
    </>)
})
