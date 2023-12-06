import { Portal } from 'share/ui/Portal'
import { Modal } from 'widgets/Modal'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { InputCustom, InputState } from 'share/ui/InputCustom/ui/InputCustom'
import { useSelector } from 'react-redux'
import { getPasswordProfile } from '../../models/selectors/getPasswordProfile/getPasswordProfile'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { setPassword } from '../../index'
import { getErrorProfile } from '../../models/selectors/getErrorProfile/getErrorProfile'
import { ErrorsPasswordUpdate } from 'features/Profile/models/types/ProfileType'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import { updatePassword } from '../../models/actions/updatePassword'


interface VerifyWindowProps {
    isOpen: boolean
    close: () => void
}
const ChangePasswordWindow: React.FC<VerifyWindowProps> = memo(({ isOpen, close }: VerifyWindowProps) => {
    const {t} = useTranslation('reset')
    const password = useSelector(getPasswordProfile)
    const errors = useSelector(getErrorProfile)
    const dispatch = useAppDispatch()
    const onChangePassword = useCallback((e:string) => {
          dispatch(setPassword(e))
    }, [password])
    const onClick = useCallback(() => {
        dispatch(updatePassword(password))
  }, [password])
    const validate = {
        [ErrorsPasswordUpdate.ERROR_SERVER]: t('Něco se pokazilo'),
       [ErrorsPasswordUpdate.WRONG_PASSWORD]: t('nesprávné heslo')
    }
    return (<>
        <Portal element={document.body}>
            <Modal zIndex={100} lazy={true} isOpen={isOpen} close={close}>
                   <div>
                    {errors && errors?.map((error: ErrorsPasswordUpdate) => <h1>{validate[error]}</h1>)}
                     <h1>{t('Změnit heslo')}</h1>
                     <InputCustom placeholder= {t('zadejte heslo')} state= {InputState.INPUTPAYMENT} value= {password} onChange={onChangePassword}/>
                   </div>
                   <ButtonCustom onClick={onClick} state= {ButtonCustomState.BUTTONAUTO}>{t('změnit heslo')}</ButtonCustom>
            </Modal>
        </Portal>
    </>)
})
export default ChangePasswordWindow