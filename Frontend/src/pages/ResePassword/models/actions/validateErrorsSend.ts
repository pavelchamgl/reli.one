import {  resetPasswordErrorPasswordCode, sendNewPassword } from '../types/ResetPasswordSchema'

export const validateErrorsSend = (data: sendNewPassword) => {
    const errors: resetPasswordErrorPasswordCode[] = []
    if ( data.password.length < 4) {
        errors.push(resetPasswordErrorPasswordCode.INCORRECT_PASSWORD)
    }
    return errors
}
