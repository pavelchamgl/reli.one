import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
export const getLoadingProfile = (state: GlobalScheme) => state.profile?.isLoading
