import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getComments, postComment } from "../api/commentApi";
import axios from "axios";

export const fetchGetComments = createAsyncThunk(
    "comment/fetchGetComments",
    async (id, { rejectWithValue, getState }) => {
        try {
            const state = getState().comment
            console.log(state);
            const res = await getComments(id, state.page)
            console.log(res);
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const fetchPostComment = createAsyncThunk(
    "comment/fetchPostComment",
    async (obj, { rejectWithValue, dispatch }) => {
        try {
            if (obj) {
                const res = await postComment(obj?.id, obj?.obj)
                console.log(res);
                if (res.status === 201) {
                    dispatch(addComment(obj))
                }
                return res
            }
        } catch (error) {
            return rejectWithValue()
        }
    }
)


const commentSlice = createSlice({
    name: "comment",
    initialState: {
        comments: [],
        page: 1,
        err: "",
        status: "",
        count: null
    },
    reducers: {
        addComment: (state, action) => {
            return {
                ...state,
                comments: [...state.comments, action.payload]
            }
        },
        setCommentPage: (state, action) => {
            return {
                ...state,
                page: action.payload
            }
        }

    },
    extraReducers: (builder) => {
        builder.addCase(fetchGetComments.pending, (state, action) => {
            state.status = "pending"
        }),
            builder.addCase(fetchGetComments.fulfilled, (state, action) => {
                state.status = "fulfilled",
                    state.comments = action.payload.results
                state.count = action.payload.count
            }),
            builder.addCase(fetchGetComments.rejected, (state, action) => {
                state.status = "rejected"
                state.err = action.payload
            })
    }
})

export const { addComment, setCommentPage } = commentSlice.actions

export const { reducer } = commentSlice