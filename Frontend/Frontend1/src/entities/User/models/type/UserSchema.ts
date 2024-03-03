export interface User {
    id: string
    email: string
    first_name: string
    last_name: string
}
export interface Token {
    token?: string
}
export interface UserScheme {
    authData?: User
    token?: string
}
