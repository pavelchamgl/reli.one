import { screen, fireEvent } from '@testing-library/react'
import { NavBar } from 'widgets/NavBar'
import { RouterProvider } from 'share/libs/RouterProvider/RouterProvider'

describe('NavBar test', () => {
    test('Initial test', () => {
        RouterProvider(<NavBar/>)
        const Navbar = screen.getByTestId('Navbar')
        expect(Navbar).toBeInTheDocument()

    })

    test('UnderNavBar Test', () => {
        RouterProvider(<NavBar/>)
        const button = screen.getByTestId('ButtonNavbar')
        expect(button).toBeInTheDocument()

        fireEvent.click(button)
        expect(screen.getByTestId('UnderNavbar')).toHaveClass('open')
    })

})
