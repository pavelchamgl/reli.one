import { createSelector } from '@reduxjs/toolkit'
import { getStateUser } from '../getStateUser/getStateUser'
import { type UserScheme } from '../../type/UserSchema'
export const getUser = createSelector(getStateUser, (state: UserScheme) => state.authData)
