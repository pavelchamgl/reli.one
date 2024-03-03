import { createSelector } from '@reduxjs/toolkit'
import { ProfileSchema, type Profile } from '../../types/ProfileType'
import { getDataProfile } from '../getDataProfile/getDataProfile'

export const getFirstNameProfile = createSelector(getDataProfile, (state: Profile) => state?.first_name || '')