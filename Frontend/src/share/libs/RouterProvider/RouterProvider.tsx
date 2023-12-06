import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from 'share/libs/i18next/i18n'
export const RouterProvider = (children: React.ReactNode) => {

    return (render(
        <BrowserRouter>
            <I18nextProvider i18n={i18n}>
                {children}
            </I18nextProvider>
        </BrowserRouter>
    ))
}
