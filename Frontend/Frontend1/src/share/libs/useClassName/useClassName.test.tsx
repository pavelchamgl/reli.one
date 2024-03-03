import { useClassName } from 'share/libs/useClassName/useClassName'

describe('useClassName Test', () => {
    test('First test', () => {
        expect(useClassName({ cls: 'dfdf', mode: {}, classes: [] })).toBe('dfdf')
    })
    test('Test with mode:true', () => {
        expect(useClassName({ cls: 'dfdf', mode: { share: true }, classes: [] })).toBe('dfdf share')
    })
    test('Test with mode:false', () => {
        expect(useClassName({ cls: 'dfdf', mode: { share: false }, classes: [] })).toBe('dfdf')
    })
})
