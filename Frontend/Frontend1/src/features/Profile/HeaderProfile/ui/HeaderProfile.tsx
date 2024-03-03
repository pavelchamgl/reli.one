import { useTranslation } from 'react-i18next'
import { memo, useCallback, useState } from 'react'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import ChangePasswordWindow from './ChangePasswordWindow'




const HeaderProfile: React.FC = memo(() => {

    const { t } = useTranslation('profile')
    const [open, setOpen] = useState<boolean>(false)
    const onClick = useCallback(() => {
     setOpen((prevState) => !prevState)
    }, [open, setOpen])

    return (<>
        {
            <ButtonCustom onClick={onClick} state={ButtonCustomState.BUTTONEDIT}>
                    {t('Upravit')}
            </ButtonCustom>
            
        }
        <ChangePasswordWindow isOpen = {open} close={onClick}/>

    </>)
})
export default HeaderProfile
