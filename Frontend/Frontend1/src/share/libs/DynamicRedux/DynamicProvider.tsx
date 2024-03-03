import { type GlobalSchemaKeys, type ReducerManager } from 'app/providers/Redux/models/types/ReduxType'
import { type Reducer } from '@reduxjs/toolkit'
import { useEffect } from 'react'
import { useStore } from 'react-redux'

export type DynamicList = {
    [name in GlobalSchemaKeys]?: Reducer
}
interface DynamicProviderProps {
    children: React.ReactNode
    DynamicReducers: DynamicList
}
export const DynamicProvider: React.FC<DynamicProviderProps> = ({ children, DynamicReducers }: DynamicProviderProps) => {
    const store = useStore() as ReducerManager
    useEffect(() => {
        Object.entries(DynamicReducers).forEach(([key, reducer]: [GlobalSchemaKeys, Reducer]) => {
            store.reducerManager.add(key, reducer)
        })

        return () => {
            Object.keys(DynamicReducers).forEach((key: GlobalSchemaKeys) => {
                store.reducerManager.remove(key)
            })
        }
    }, [])
    return (<>
        {children}
    </>)
}
