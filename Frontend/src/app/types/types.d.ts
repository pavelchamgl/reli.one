declare module '*.scss' {
    const content: any
    export default content
}

declare module '*.png' {
    const value: any
    export default value
}

declare module '*.json' {
    const value: any
    export default value
}

declare const __IS_DEV__: boolean
declare const __API__: string
