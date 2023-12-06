export enum ErrorsComment {
    SERVER_ERROR = 'SERVER_ERROR',
    INCORRECT_DATA = 'INCORRECT_DATA'
}

export interface typeForActionAddComment {
    goodsId: string
    author: string
    text: string
}

export interface AddCommentSchema {
    text?: string
    isLoading: boolean
    error: ErrorsComment[]
}
