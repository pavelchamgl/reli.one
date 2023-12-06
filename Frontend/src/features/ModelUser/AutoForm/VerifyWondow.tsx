import { Portal } from 'share/ui/Portal'
import { Modal } from 'widgets/Modal'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface VerifyWindowProps {
    isOpen: boolean
    close: () => void
}
const VerifyWindow: React.FC<VerifyWindowProps> = memo(({ isOpen, close }: VerifyWindowProps) => {
    const {t} = useTranslation('modal')
    return (<>
        <Portal element={document.body}>
            <Modal lazy={true} isOpen={isOpen} close={close}>
                    <h1>t{'Prosím, potvrďte svůj email!'}</h1>
            </Modal>
        </Portal>
    </>)
})
export default VerifyWindow