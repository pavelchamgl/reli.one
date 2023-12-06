import { createSelector } from '@reduxjs/toolkit'
import { type Profile } from '../../types/ProfileType'
import { getDataProfile } from '../getDataProfile/getDataProfile'

export const getEmailProfile = createSelector(getDataProfile, (state: Profile) => state?.email || '')
