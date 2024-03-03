import { type DeepPartial } from '@reduxjs/toolkit'
import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { getPassword } from 'entities/Password'

describe('Selector email test', () => {
    test('Get email fron state', () => {
        const state: DeepPartial<GlobalScheme> = {
            password: {
                password: 'pass',
                error: ''
            }
        }
        expect(getPassword(state as GlobalScheme)).toBe('pass')
    })
})
