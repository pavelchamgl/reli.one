import {
    createEntityAdapter,
    createSlice
} from '@reduxjs/toolkit'
import { type GoodsPageSchema } from '../types/GoodsPageSchema'
import { type GlobalScheme } from 'app/providers/Redux/models/types/ReduxType'
import { type Good } from 'entities/Good'
import { type PayloadAction } from '@reduxjs/toolkit/dist/createAction'
import { fetchSortPageGood } from 'pages/GoodsPage/models/actions/fetchSortPageGood'

const goodsAdapter = createEntityAdapter<Good>({
    selectId: (comment) => comment.id
})

export const getGoods = goodsAdapter.getSelectors<GlobalScheme>((state) => state.goodsPage || goodsAdapter.getInitialState())

const commentSlice = createSlice({
    name: 'books',
    initialState: goodsAdapter.getInitialState<GoodsPageSchema>({
        ids: [],
        isLoading: false,
        error: undefined,
        searchMain: 'panel',
        entities: {
        }
    }),
    reducers: {
        setSearch (state, action: PayloadAction<string>) {
            state.search = action.payload
        },

        setSearchMain (state, action: PayloadAction<string>) {
            state.searchMain = action.payload
        },
    
    
    },
    extraReducers: (builder) => (


        builder.addCase(fetchSortPageGood.pending, (state, action) => {
            state.isLoading = true
            goodsAdapter.removeAll(state)
            console.log(state.goods)
        }),
        builder.addCase(fetchSortPageGood.fulfilled, (state, action) => {
            state.isLoading = false
            state.error = undefined
            if (action.meta.arg.replace) {
                goodsAdapter.setAll(state, action.payload)
            }
            goodsAdapter.addMany(state, action.payload)

        }),
        builder.addCase(fetchSortPageGood.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.error as string
        })

    )
})
export const goodsPageReducer = commentSlice.reducer
export const {  setSearch, setSearchMain } = commentSlice.actions
