

export interface Good {
    id: string
    name: string
    images: Array<string>
    parameters: Record<string, string>
    price: string
}

export interface GoodSchema {
    good?: Good
    isLoading: boolean
    error: string
}
