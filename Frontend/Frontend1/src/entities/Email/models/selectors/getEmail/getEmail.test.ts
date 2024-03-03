import { type DeepPartial } from '@reduxjs/toolkit'
import { getEmail } from 'entities/Email'
import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'

describe('Selector email test', () => {
    test('Get email fron state', () => {
        const state: DeepPartial<GlobalScheme> = {
            email: {
                email: 'test@mail.ru',
                error: ''
            }
        }
        expect(getEmail(state as GlobalScheme)).toBe('test@mail.ru')
    })
})
