import { ErrorsLog, type UserInfo } from 'features/ModelUser/models/types/AuthUserSchema'

export const validateErrors = (user: UserInfo) => {
    const errorsValidate: ErrorsLog[] = []
    if (!user.email) {
        errorsValidate.push(ErrorsLog.NO_USER_EMAIL)
    }
    if (!user.password) {
        errorsValidate.push(ErrorsLog.NO_USER_PASSWORD)
    }

    return errorsValidate
}
