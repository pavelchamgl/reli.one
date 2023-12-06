export interface UserInfo {
    email: string
    password: string
    name?: string
    lastname?: string
    close?: () => void
    OpenModalLog?: () => void
}


export enum ErrorsLog {
    ERROR_SERVER = 'ERROR_SERVER',
    NO_USER_PASSWORD = 'NO_USER_PASSWORD',
    NO_USER_EMAIL = 'NO_USER_EMAIL',
}
export enum ErrorAuth {
    INCORRECT_EMAIL = 'INCORRECT_EMAIL',
    INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
    INCORRECT_NAME = 'INCORRECT_NAME',
    INCORRECT_LASTNAME = 'INCORRECT_LASTNAME',
    ERROR_SERVER = 'ERROR_SERVER',
}
export interface AuthUserSchema {
    isLoading: boolean
    errorLog?: ErrorsLog[]
    errorAuth?: ErrorAuth[]
}
