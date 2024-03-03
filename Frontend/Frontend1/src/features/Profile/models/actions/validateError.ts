import { ErrorsPasswordUpdate } from '../types/ProfileType'

export const validateError = (password: string) => {
    const errorsArray: ErrorsPasswordUpdate[] = []
    if (password.length <= 4) {
        errorsArray.push(ErrorsPasswordUpdate.WRONG_PASSWORD)
    }
    return errorsArray
}
