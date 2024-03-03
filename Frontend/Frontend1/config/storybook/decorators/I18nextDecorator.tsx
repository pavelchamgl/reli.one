import { I18nextProvider } from 'react-i18next'
import i18n from 'share/libs/i18next/i18n'

interface i18nextDecoratorProps {
    children: React.ReactNode
}

export const I18nextDecorator: React.FC<i18nextDecoratorProps> = ({ children }: i18nextDecoratorProps) => {
    return(
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    )
}
