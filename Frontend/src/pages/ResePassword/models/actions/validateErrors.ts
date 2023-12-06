import { resetPasswordErrorEmail } from '../types/ResetPasswordSchema'

export const validateErrors = (data: string) => {
    const errors: resetPasswordErrorEmail[] = []
    if (!data || !data.includes('@') || data.length < 4) {
        errors.push(resetPasswordErrorEmail.INCORRECT_EMAIL)
    }
    return errors
}
