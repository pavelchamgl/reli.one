import { useTranslation } from 'react-i18next'
import { InputCustom, InputState } from 'share/ui/InputCustom/ui/InputCustom'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import cls from './AutoForm.module.scss'
import { getPassword, setPassword } from 'entities/Password'
import { useSelector } from 'react-redux'
import { useCallback, useState } from 'react'
import { getEmail, setEmail } from 'entities/Email'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { getErrorAuth } from '../models/selectors/getErrorAuth/getErrorAuth'
import { ErrorAuth } from '../models/types/AuthUserSchema'
import { fetchSortPageGood } from 'pages/GoodsPage/models/actions/fetchSortPageGood'
import { getName, setName } from 'entities/Name'
import { getLastName, setLastName } from 'entities/Lastname'
import { authUser } from 'features/ModelUser/models/actions/authUser'
import VerifyWindow from './VerifyWondow'
import { useNavigate } from 'react-router-dom'

interface LoginFormProps {
    close: () => void
    OpenLogForm: () => void
}
const AutoForm: React.FC<LoginFormProps> = ({ close, OpenLogForm }: LoginFormProps) => {
    const [open, setOpen] = useState<boolean>(false)
    const navigate = useNavigate()
    const password = useSelector(getPassword)
    const email = useSelector(getEmail)
    const name = useSelector(getName)
    const lastname = useSelector(getLastName)
    const errors = useSelector(getErrorAuth)
    const dispatch = useAppDispatch()
    const { t } = useTranslation('modal')
    const HandlerPassword = useCallback((e: string) => {
        dispatch(setPassword(e))
    }, [password])
    const HandlerName = useCallback((e: string) => {
        dispatch(setName(e))
    }, [name])
    const HandlerLastName = useCallback((e: string) => {
        dispatch(setLastName(e))
    }, [lastname])
    const HandlerEmail = useCallback((e: string) => {
        dispatch(setEmail(e))
    }, [email])
    const ClickHandler = useCallback(() => {
        dispatch(authUser({ email, password, lastname, name, close: close})).then(() => {
            navigate('/verify')
        })
    }, [password, name, lastname, email, dispatch, close, open, setOpen])
    const ClickHandlerVerifyClose = useCallback(() => {
        setOpen(false)
    },[open])
    const ClickHandlerVerifyOpen = useCallback(() => {
        setOpen(true)
    },[open])
    


    const validErros = {
        [ErrorAuth.INCORRECT_EMAIL]: t('Zadali jste nesprávné e-mailové informace'),
        [ErrorAuth.INCORRECT_PASSWORD]: t('Zadali jste nesprávné heslo'),
        [ErrorAuth.INCORRECT_NAME]: t('Zadali jste nesprávné jméno'),
        [ErrorAuth.INCORRECT_LASTNAME]: t('Zadali jste nesprávné příjmení'),
        [ErrorAuth.ERROR_SERVER]: t('Něco se pokazilo')
    }
    return (
        <div className={cls.LoginC}>
            <div className={cls.OrderContainer}> <h1>{t('Přihlásit se')}</h1> <ButtonCustom classes={cls.close} state={ButtonCustomState.BUTTONCLOSE} onClick={close}/> </div>
            <hr/>
            <div className={cls.InputsContainer}>
                {
                    errors?.map((error, index) => <h1 key={ index } className={cls.error}>{validErros[error]}</h1>)
                }
                <div className={cls.InputContainer}>
                    <div className={cls.PlaceContainer}> {t('Emailová adresa')}</div>
                    <InputCustom value={email} onChange={HandlerEmail} classe={cls.InputLogin} state={InputState.MODALINPUT}></InputCustom>
                </div>

                <div className={cls.InputContainer}>
                    <div className={cls.PlaceContainer}> {<div>{t('Název')}</div>} </div>
                    <InputCustom value={name} onChange={HandlerName} classe={cls.InputLogin} state={InputState.MODALINPUT}></InputCustom>
                </div>

                <div className={cls.InputContainer}>
                    <div className={cls.PlaceContainer}> {<div>{t('Příjmení')}</div>}</div>
                    <InputCustom value={lastname} onChange={HandlerLastName} classe={cls.InputLogin} state={InputState.MODALINPUT}></InputCustom>
                </div>

                <div className={cls.InputContainer}>
                    <div className={cls.PlaceContainer}> {<div>{t('Heslo')}</div>} </div>
                    <InputCustom value={password} onChange={HandlerPassword} classe={cls.InputLogin} state={InputState.MODALINPUT} type= 'password'></InputCustom>
                </div>
                <ButtonCustom onClick={ClickHandler} classes={cls.BottanLogin} state={ButtonCustomState.BUTTONMODAL}>{t('Registrovat')}</ButtonCustom>
            </div>
            <VerifyWindow isOpen = {open} close={ClickHandlerVerifyClose} />
        </div>
    )

}
export default AutoForm
