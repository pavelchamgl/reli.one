import { type UserScheme } from 'entities/User/models/type/UserSchema'
import { type AuthUserSchema } from 'features/ModelUser/models/types/AuthUserSchema'
import { type PasswordSchema } from 'entities/Password/models/types/passwordT'
import { type EmailSchema } from 'entities/Email/models/types/emailSchema'
import { type AnyAction, type CombinedState, type Reducer } from '@reduxjs/toolkit'
import { type ProfileSchema } from 'features/Profile/models/types/ProfileType'
import { type GoodSchema } from 'entities/Good'
import { type CommentSchema } from 'entities/Comments/models/types/CommentSchema'
import { type AddCommentSchema } from 'features/AddComment'
import { type GoodsPageSchema } from 'pages/GoodsPage'
import { type NameSchema } from 'entities/Name'
import { type LastNameSchema } from 'entities/Lastname'
import { PasswordProfileSchema } from 'features/Profile/models/passwordSlice/passwordSlice'
import { ResetPasswordSchema } from 'pages/ResePassword/models/types/ResetPasswordSchema'

export interface GlobalScheme {
    user: UserScheme
    auth: AuthUserSchema
    password: PasswordSchema
    email: EmailSchema
    name: NameSchema
    lastname: LastNameSchema
    profile: ProfileSchema
    goods: GoodSchema
    comments: CommentSchema
    addComment: AddCommentSchema
    goodsPage: GoodsPageSchema,
    profilePassword: PasswordProfileSchema,
    resetPassword: ResetPasswordSchema

}

export type GlobalSchemaKeys = keyof GlobalScheme

interface ReduxManagerInterface {
    getReducerMap: () => Reducer[]
    reduce: (state: CombinedState<GlobalScheme>, action: AnyAction) => CombinedState<GlobalScheme>
    add: (key: GlobalSchemaKeys, reducer: Reducer) => void
    remove: (key: GlobalSchemaKeys) => void
}

export interface ReducerManager {
    reducerManager?: ReduxManagerInterface
}

export interface ThunkExtraArg {
}

export interface ThunkConfig<T> {
    rejectValue: T
    extra: ThunkExtraArg
    state: GlobalScheme
}
