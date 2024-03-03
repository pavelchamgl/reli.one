import { type DeepPartial } from '@reduxjs/toolkit'
import { type PasswordSchema } from 'entities/Password/models/types/passwordT'
import { passwordReducer, setPassword } from 'entities/Password'

describe('PasswordSlice Test', () => {
    test('SetPassword Test', () => {
        const passwordState: DeepPartial<PasswordSchema> = {
            password: ''
        }
        expect(passwordReducer(passwordState as PasswordSchema, setPassword('test')).password).toBe('test')
    })
})
