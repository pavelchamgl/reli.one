import { SideBar } from 'widgets/SideBar'
import { memo, useEffect } from 'react'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { useSelector } from 'react-redux/es/exports'
import { getLoadingProfile, profileReducer, fetchProfile, getEmailProfile, getFirstNameProfile, profilePasswordReducer } from 'features/Profile'
import { DynamicProvider } from 'share/libs/DynamicRedux/DynamicProvider'
import { AsyncInnerProfile } from '../../InnerProfiel/ui/AsyncInnerProfile'
import { getUser } from 'entities/User/models/selectors/getUser/getUser'


interface ProfileSideBarProps {
    Open: boolean
    HandlerOpen: () => void
}
export const ProfileSideBar: React.FC<ProfileSideBarProps> = memo((props: ProfileSideBarProps) => {
    const {
        Open,
        HandlerOpen
    } = props

    const dispatch = useAppDispatch()
    const isLoading = useSelector(getLoadingProfile)
    const email = useSelector(getEmailProfile)
    const first_name = useSelector(getFirstNameProfile)
    const userId = useSelector(getUser)
  



    useEffect(() => {
        dispatch(fetchProfile(userId.id))
    }, [dispatch])

    return (<>
        <DynamicProvider DynamicReducers={ { profile: profileReducer, profilePassword: profilePasswordReducer } }>
            <SideBar lazy={true} setOpen={HandlerOpen} Open={Open}>
                <AsyncInnerProfile HandlerCloseSideBar = {HandlerOpen}  first_name={first_name} email={email} isLoading={isLoading} />
            </SideBar>
        </DynamicProvider>
    </>)
})
