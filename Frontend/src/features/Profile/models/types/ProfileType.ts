export interface Profile {
    id?: string
    email?: string
    first_name?: string
}
export enum ErrorsPasswordUpdate {
    ERROR_SERVER = 'ERROR_SERVER',
    WRONG_PASSWORD = 'NO_USER_EMAIL'
}
export interface ProfileSchema {
    data?: Profile
    isLoading: boolean
    errorsPassword: ErrorsPasswordUpdate[]
}
