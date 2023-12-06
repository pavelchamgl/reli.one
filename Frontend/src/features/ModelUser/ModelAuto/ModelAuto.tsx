import { Portal } from 'share/ui/Portal'
import { Modal } from 'widgets/Modal'
import { DynamicProvider } from 'share/libs/DynamicRedux/DynamicProvider'
import { AuthReducer } from '../models/slice/AuthUserSlice'
import { emailReducer } from 'entities/Email'
import { passwordReducer } from 'entities/Password'
import { memo } from 'react'
import { nameReducer } from 'entities/Name'
import { lastNameReducer } from 'entities/Lastname'
import { AsyncAutoForm } from '../AutoForm/AsyncAutoForm'

interface ModalWindowProps {
    isOpen: boolean
    close: () => void
    OpenLogForm: () => void
}
export const ModelAuto: React.FC<ModalWindowProps> = memo(({ isOpen, close, OpenLogForm }: ModalWindowProps) => {
    return (<>
        <Portal element={document.body}>
            <Modal lazy={true} isOpen={isOpen} close={close}>
                <DynamicProvider DynamicReducers={{ auth: AuthReducer, email: emailReducer, password: passwordReducer, name: nameReducer, lastname: lastNameReducer }}>
                    <AsyncAutoForm OpenLogForm={OpenLogForm} close={close}/>
                </DynamicProvider>
            </Modal>
        </Portal>
    </>)
})
