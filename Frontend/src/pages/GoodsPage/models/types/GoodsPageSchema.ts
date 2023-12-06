import { type Good } from 'entities/Good'
import { type EntityState } from '@reduxjs/toolkit'

export interface GoodsPageSchema extends EntityState<Good> {
    isLoading: boolean
    error: string
    goods?: Good[]
    search?: string
    searchMain?: string
    
}
