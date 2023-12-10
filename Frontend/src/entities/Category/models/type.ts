import { type User } from 'entities/User/models/type/UserSchema'
import { type EntityState } from '@reduxjs/toolkit'

export interface Category {
    id: string
    name: string
}
export interface CategorySchema  {
    isLoading: boolean
    error: string
    categorys: Category[]
}
