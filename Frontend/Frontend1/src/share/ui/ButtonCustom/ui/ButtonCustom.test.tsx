import { render, screen } from '@testing-library/react'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'

describe('Button Test', () => {
    test('Children props test', () => {
        render(<ButtonCustom state={ButtonCustomState.RESET}>Zbozi</ButtonCustom>)
        expect(screen.getByText('Zbozi')).toBeInTheDocument()

    })
})
