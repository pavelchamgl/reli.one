import axios from 'axios'
import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { type Dispatch } from '@reduxjs/toolkit'
import { logUser } from './logUser'

jest.mock('axios')
const axiosMock = jest.mocked(axios)
let dispatch: Dispatch
let getState: () => GlobalScheme
describe('Auth User Test', () => {
    beforeEach(() => {
        dispatch = jest.fn()
        getState = jest.fn()
    })
    test('auth user', async () => {
        axiosMock.post.mockReturnValue(Promise.resolve({ id: '1', email: 'some@mail.ru' }))
        const action = logUser({ email: 'some@mail.ru', password: '123' })

        const result = await action(dispatch, getState, undefined)

        expect(axiosMock.post).toBeCalled()
        expect(result.meta.requestStatus).toBe('fulfilled')
        expect(dispatch).toBeCalledTimes(3)

    })
})
