import { type User } from 'entities/User/models/type/UserSchema'
import { type EntityState } from '@reduxjs/toolkit'

export interface ProjectKeyForm {
    id: string
    email: string
    address: string
    company_name: string
    message: string
    phone: string
    name: string
}
export interface ProjectKeyFormSchema  {
    isLoading: boolean
    error: string
    form: ProjectKeyForm
}
