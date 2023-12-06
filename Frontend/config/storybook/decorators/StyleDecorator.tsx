import 'app/styles/index.scss'

interface styleDecoratorProps {
    children: React.ReactNode
}
export const StyleDecorator: React.FC<styleDecoratorProps> = ({children}: styleDecoratorProps) => {
    return(
        <>
            {children}
        </>
    )
}
