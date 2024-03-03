export interface AlignDecoratorProps {
    children?: React.ReactNode
}

export const AlignDecorator: React.FC<AlignDecoratorProps> = ({ children }: AlignDecoratorProps) => {
    return( <div style={{display: "flex", justifyContent: "center", height:"80vh", alignItems: "center"}}>
          {children}
        </div>)
}
