import {
    createEntityAdapter,
    createSlice,
    PayloadAction
} from '@reduxjs/toolkit'
import { type ProjectKeyForm, type ProjectKeyFormSchema } from './type'
import { sendProjectKey } from './actions/sendProjectKey'



const initialState: ProjectKeyFormSchema ={
   isLoading: false,
   form:  {
    id: undefined,
    name: undefined,
    company_name: undefined,
    phone: undefined,
    address: undefined,
    message: undefined,
    email: undefined

   },
   error: undefined
}
const sliceProjectKey = createSlice({
    name: 'books',
    initialState: initialState,
    reducers: {
        setEmail(state, action: PayloadAction<string>) {
            state.form.email = action.payload
        },
        setPhone(state, action: PayloadAction<string>) {
            state.form.phone = action.payload
        },
        setMessage(state, action: PayloadAction<string>) {
            state.form.message = action.payload
        },
        setCompanyName(state, action: PayloadAction<string>) {
            state.form.company_name = action.payload
        },
        setAdresse(state, action: PayloadAction<string>) {
            state.form.address = action.payload
        },
        setName(state, action: PayloadAction<string>) {
            state.form.name = action.payload
        }
        
    },
    extraReducers: (builder) => (
        builder.addCase(sendProjectKey.pending, (state) => {
            state.isLoading = true
        }),
        builder.addCase(sendProjectKey.fulfilled, (state, action) => {
            state.isLoading = false
        }),
        builder.addCase(sendProjectKey.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.payload
        })

    )
})
export const projectKeyReducer = sliceProjectKey.reducer


export const {setAdresse, setCompanyName, setEmail, setMessage , setPhone } = sliceProjectKey.actions