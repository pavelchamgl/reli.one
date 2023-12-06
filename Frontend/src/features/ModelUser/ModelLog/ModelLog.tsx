import { Portal } from 'share/ui/Portal'
import { Modal } from 'widgets/Modal'
import { AsyncLoginForm } from '../LoginForm/AsyncLoginForm'
import { DynamicProvider } from 'share/libs/DynamicRedux/DynamicProvider'
import { AuthReducer } from '../models/slice/AuthUserSlice'
import { emailReducer } from 'entities/Email'
import { passwordReducer } from 'entities/Password'
import { memo } from 'react'

interface ModalWindowProps {
    isOpen: boolean
    close: () => void
    OpenModalAuto: () => void
}
export const ModelLog: React.FC<ModalWindowProps> = memo(({ isOpen, close, OpenModalAuto }: ModalWindowProps) => {
    return (<>
        <Portal element={document.body}>
            <Modal lazy={true} isOpen={isOpen} close={close}>
                <DynamicProvider DynamicReducers={{ auth: AuthReducer, email: emailReducer, password: passwordReducer }}>
                    <AsyncLoginForm OpenModalAuto = {OpenModalAuto} close={close}/>
                </DynamicProvider>
            </Modal>
        </Portal>
    </>)
})
