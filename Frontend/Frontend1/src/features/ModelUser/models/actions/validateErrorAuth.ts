import { ErrorAuth, type UserInfo } from '../types/AuthUserSchema'

export const validateErrorAuth = (userInfo: UserInfo) => {
    const arrErrors: ErrorAuth[] = []
    if (!userInfo.email || !userInfo.email.includes('@') || userInfo.email.length < 4) {
        arrErrors.push(ErrorAuth.INCORRECT_EMAIL)
    }

    if (!userInfo.password || userInfo.password.length < 4) {
        arrErrors.push(ErrorAuth.INCORRECT_PASSWORD)
    }

    if (!userInfo.name || userInfo.name.length < 4) {
        arrErrors.push(ErrorAuth.INCORRECT_NAME)
    }

    if (!userInfo.lastname || userInfo.lastname.length < 4) {
        arrErrors.push(ErrorAuth.INCORRECT_LASTNAME)
    }
    return arrErrors
}
