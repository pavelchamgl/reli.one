import { useTranslation } from 'react-i18next'
import { InputCustom, InputState } from 'share/ui/InputCustom/ui/InputCustom'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import cls from './loginForm.module.scss'
import { LinkCustom } from 'share/ui/LinkCustom'
import { StateLink } from 'share/ui/LinkCustom/ui/LinkCustom'
import { getPassword, setPassword } from 'entities/Password'
import { useSelector } from 'react-redux'
import { useCallback } from 'react'
import { getEmail, setEmail } from 'entities/Email'
import { logUser } from '../models/actions/logUser'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { ErrorsLog } from '../models/types/AuthUserSchema'
import { fetchSortPageGood } from 'pages/GoodsPage/models/actions/fetchSortPageGood'
import { getErrorLog } from 'features/ModelUser/models/selectors/getErrorLog/getErrorLog'

interface LoginFormProps {
    close: () => void
    OpenModalAuto: () => void
}
const LoginForm: React.FC<LoginFormProps> = ({ close, OpenModalAuto }: LoginFormProps) => {
    const password = useSelector(getPassword)
    const email = useSelector(getEmail)
    const errors = useSelector(getErrorLog)
    const dispatch = useAppDispatch()
    const { t } = useTranslation('modal')
    const HandlerPassword = useCallback((e: string) => {
        dispatch(setPassword(e))
    }, [password])
    const clickReset = useCallback(() => {
        close()
    },[dispatch])
    const HandlerEmail = useCallback((e: string) => {
        dispatch(setEmail(e))
    }, [email])
    const ClickHandler = useCallback(() => {
        dispatch(logUser({ email, password, close: close, OpenModalLog: OpenModalAuto })).then((response) => {
            dispatch(fetchSortPageGood({ replace: true }))
        })

    }, [dispatch, email, password])
    const OpenAutoHandler = useCallback(() => {
        close()
        OpenModalAuto()
    }, [])
    const validErros = {
        [ErrorsLog.NO_USER_EMAIL]: t('Nevyplnili jste pole pro e-mail'),
        [ErrorsLog.NO_USER_PASSWORD]: t('Nevyplnili jste pole pro heslo'),
        [ErrorsLog.ERROR_SERVER]: t('Něco se pokazilo')
    }
    return (
        <div className={cls.LoginC}>
            <div className={cls.OrderContainer}> <h1>{t('Přihlásit se')}</h1> <ButtonCustom classes={cls.close} state={ButtonCustomState.BUTTONCLOSE} onClick={close}/> </div>
            <hr/>
            <div className={cls.InputsContainer}>
                {
                    errors?.map((error, index) => <h1 key = {index} className={cls.error}>{validErros[error]}</h1>)
                }
                <div className={cls.InputContainer}>
                    <div className={cls.PlaceContainer}> {t('Emailová adresa')}</div>
                    <InputCustom value={email} onChange={HandlerEmail} classe={cls.InputLogin} state={InputState.MODALINPUT}></InputCustom>
                </div>

                <div className={cls.InputContainer}>
                    <div className={cls.PlaceContainer}> {<div>{t('Heslo')}</div>} <span>{<LinkCustom onClick={clickReset}  to='/reset' state={StateLink.LINKRESET}>{t('Zapomenuté heslo')}</LinkCustom>}</span></div>
                    <InputCustom value={password} onChange={HandlerPassword} classe={cls.InputLogin} state={InputState.MODALINPUT} type= 'password'></InputCustom>
                </div>
                <ButtonCustom onClick={ClickHandler} classes={cls.BottanLogin} state={ButtonCustomState.BUTTONMODAL}>{t('pokračovat')}</ButtonCustom>
                <p>{t('Nemáte účet?')} <ButtonCustom classes= {cls.ButtonReg} onClick={OpenAutoHandler} state={ButtonCustomState.BUTTONAUTO}>{t('Zaregistrujte se zde')}</ButtonCustom></p>
            </div>
        </div>
    )

}
export default LoginForm
