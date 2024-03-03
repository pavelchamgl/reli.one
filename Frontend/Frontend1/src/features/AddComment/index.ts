export { addCommentReducer, setText } from './models/addCommentSlice/addCommentSlice'
export { type AddCommentSchema } from './models/types/AddCommentSchema'
export { getErrorAddComment, getTextAddComment, getStateAddComment, getLoadingAddComment } from './models/selectors/addCommentSelectors'
export { AsyncAddComment as AddComment } from './ui/AsyncAddComment'
