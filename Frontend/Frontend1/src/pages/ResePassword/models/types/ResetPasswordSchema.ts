import { NavigateFunction } from "react-router-dom"

export enum resetPasswordErrorEmail {
    SERVER_ERROR = 'SERVER_ERROR',
    INCORRECT_EMAIL = 'INCORRECT_EMAIL'
}
export enum resetPasswordErrorPasswordCode {
    INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
    SERVER_ERROR = 'SERVER_ERROR'
}
export interface sendNewPassword {
    password: string
    code: string,
    navigate: NavigateFunction
}

export interface ResetPasswordSchema {
    password: string
    canSend: boolean
    code: string
    email: string
    isLoading: boolean
    errorsEmail: resetPasswordErrorEmail[]
    errorsPassword: resetPasswordErrorPasswordCode[]
}
