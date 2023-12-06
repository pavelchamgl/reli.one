import { getErrorAddComment, getTextAddComment, setText } from '../index'
import { InputCustom, InputState } from 'share/ui/InputCustom/ui/InputCustom'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import { useTranslation } from 'react-i18next'
import cls from './AddComment.module.scss'
import { memo, useCallback } from 'react'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { useSelector } from 'react-redux'
import { createComment } from 'features/AddComment/models/actions/createComment'
import { useParams } from 'react-router-dom'
import { getUser } from 'entities/User/models/selectors/getUser/getUser'
import { ErrorsComment } from '../models/types/AddCommentSchema'
const AddComment: React.FC = memo(() => {
    const { t } = useTranslation('goods')
    const id = useParams<{ id: string }>()
    const dispatch = useAppDispatch()
    const errors = useSelector(getErrorAddComment)
    const text = useSelector(getTextAddComment)
    const user = useSelector(getUser)
    const ClickHandler = useCallback(() => {
        dispatch(createComment({ goodsId: id.id, text, author: user.id }))
    }, [dispatch, text])
    const onChangeHandler = useCallback((e: string) => {
        dispatch(setText(e))
    }, [dispatch])
    const validateObj = {
        [ErrorsComment.INCORRECT_DATA]: t('Vyplňte komentář'),
        [ErrorsComment.SERVER_ERROR]: t('Zaregistrujte se zde')
    }
    return (<>
        <div className={cls.AddContainer} >
            <h3 className={cls.Error}>{errors?.map((error) => validateObj[error])}</h3>
            <InputCustom value={text} onChange={onChangeHandler} classe={cls.InputCustom} placeholder= 'napsat komentář...' state={InputState.COMMENTINPUT}></InputCustom>
            <ButtonCustom classes={cls.ButtonSend} onClick={ClickHandler} state={ButtonCustomState.BUTTONPURCHASE}>{t('Odejít')}</ButtonCustom>
        </div>

    </>)
})
export default AddComment
