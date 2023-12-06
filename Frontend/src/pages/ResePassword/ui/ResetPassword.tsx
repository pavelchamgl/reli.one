import { memo, useCallback } from "react"
import { resetPasswordErrorEmail, resetPasswordErrorPasswordCode } from "../models/types/ResetPasswordSchema"
import { InputCustom, InputState } from "share/ui/InputCustom/ui/InputCustom"
import { DynamicProvider } from "share/libs/DynamicRedux/DynamicProvider"
import { resetPasswordReducer } from "../models/resetPasswordSlice/resetPasswordSlice"
import { ButtonCustom, ButtonCustomState } from "share/ui/ButtonCustom/ui/ButtonCustom"
import { useAppDispatch } from "share/libs/useRedux/useRedux"
import { useSelector } from "react-redux"
import { getCanSendResetPassword, getCodeResetPassword, getEmailResetPassword, getErrorsEmailResetPassword, getErrorsPasswordResetPassword, getNewPasswordResetPassword } from "../models/selectors/addCommentSelectors"
import { setCode, setEmail, setPassword} from '../models/resetPasswordSlice/resetPasswordSlice'
import cls from './ResetPasswordStyle.module.scss'
import { sendEmail } from "../models/actions/sendEmail"
import { SendNewPassword } from "../models/actions/sendNewPassword"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
export const ResetPassword : React.FC = memo(() => {
    const {t} = useTranslation('reset')
    const dispatch = useAppDispatch()
    const email = useSelector(getEmailResetPassword)
    const code = useSelector(getCodeResetPassword)
    const password = useSelector(getNewPasswordResetPassword)
    const errorsEmail = useSelector(getErrorsEmailResetPassword)
    const errorsPassword = useSelector(getErrorsPasswordResetPassword)
    const canSend = useSelector(getCanSendResetPassword)
    const navigate = useNavigate()
    const onChangePassword = useCallback((e:string) => {
      dispatch(setPassword(e))
    }, [password])

    const onChangeCode= useCallback((e:string) => {
        dispatch(setCode(e))
    }, [code])

    const onChangeEmail = useCallback((e:string) => {
        dispatch(setEmail(e))
    }, [email])
    const onClick = useCallback(() => {
        dispatch(sendEmail(email))
  }, [email])
  const onClickSend = useCallback(() => {
     dispatch(SendNewPassword({code, password, navigate }))
  }, [code, password])
    const validate = {
        [resetPasswordErrorEmail.INCORRECT_EMAIL]: t('Něco se pokazilo'),
       [resetPasswordErrorEmail.SERVER_ERROR]: t('nesprávné heslo')
    }

    const validate2 = {
      [resetPasswordErrorPasswordCode.INCORRECT_PASSWORD]: t('Něco se pokazilo'),
     [resetPasswordErrorPasswordCode.SERVER_ERROR]: t('nesprávné heslo')
  }
    return (<>
    <DynamicProvider DynamicReducers={{resetPassword: resetPasswordReducer}}>
            <div className= {cls.ResetContainer}>
                <div className= {cls.innerContainer}>
                  <div>
                  { !canSend &&  errorsEmail?.map((erro) => <h1 style={{color: 'red'}}>{validate[erro]}</h1>)}
                     <h1>{t('aktualizace hesla')}</h1>
                     {
                        !canSend &&
                        <InputCustom placeholder={t('vložte svůj e-mail')} state= {InputState.INPUTPAYMENT} value= {password} onChange={onChangeEmail}/>
                     }
                     
                   </div>
                   {
                     canSend &&
                   <div>
                    {errorsPassword?.map((erro) => <h1 style={{color: 'red'}}>{validate2[erro]}</h1>)}
                    <InputCustom classe= {cls.inputCustom} placeholder={t('zadejte heslo')} state= {InputState.INPUTPAYMENT} value= {password} onChange={onChangePassword}/>
                    <InputCustom classe= {cls.inputCustom} placeholder={t('zadejte kód')} state= {InputState.INPUTPAYMENT} value= {code} onChange={onChangeCode}/>
                   </div>
                   }
                   {
                    !canSend &&
                    <ButtonCustom classes= {cls.ButtonC} onClick={onClick} state= {ButtonCustomState.BUTTONAUTO}>{t('poslat e-mailem')}</ButtonCustom>
                   }
                   {
                    canSend &&
                    <ButtonCustom classes= {cls.ButtonC} onClick={onClickSend} state= {ButtonCustomState.BUTTONAUTO}>{t('aktualizovat heslo')}</ButtonCustom>
                   }
                   
                </div>
                 
            </div>
    </DynamicProvider>
    </>)
})
