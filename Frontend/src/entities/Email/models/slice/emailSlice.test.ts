import { emailReducer, setEmail } from 'entities/Email'
import { type DeepPartial } from '@reduxjs/toolkit'
import { type EmailSchema } from 'entities/Email/models/types/emailSchema'

describe('EmailSlice Test', () => {
    test('SetEmail Test', () => {
        const emailState: DeepPartial<EmailSchema> = {
            email: ''
        }
        expect(emailReducer(emailState as EmailSchema, setEmail('test@mail.ru')).email).toBe('test@mail.ru')
    })
})
