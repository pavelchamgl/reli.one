import {BrowserRouter} from "react-router-dom";

interface routerDecoratorProps {
    children: React.ReactNode
}
export const RouterDecorator: React.FC<routerDecoratorProps> = ({children}: routerDecoratorProps) => {
    return(
        <BrowserRouter>
            {children}
        </BrowserRouter>
    )
}
