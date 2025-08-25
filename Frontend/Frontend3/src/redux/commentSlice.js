import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getComments, postComment } from "../api/commentApi";
import axios from "axios";

export const fetchGetComments = createAsyncThunk(
    "comment/fetchGetComments",
    async (id, { rejectWithValue, getState }) => {
        try {
            const state = getState().comment
            const res = await getComments(id, state.page)
            return res.data
        } catch (error) {
            return rejectWithValue(error)
        }
    }
)

export const fetchPostComment = createAsyncThunk(
    "comment/fetchPostComment",
    async (formData, { rejectWithValue, dispatch }) => {
        try {
            const res = await postComment(formData); // Передаём formData напрямую

            if (res.status === 201) {
                // dispatch(addComment(res.data)); // Добавляем новый комментарий
                window.location.reload()
            }
            return res.data; // Возвращаем данные ответа
        } catch (error) {
            console.log(error);
            if (error && error?.response) {
                if (error?.response?.status === 400) {
                    if (Object.keys(error?.response?.data).includes("rating")) {
                        return rejectWithValue(error.response?.data?.rating[0] || error.message);
                    }
                }
            }
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);



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
        builder.addCase(fetchPostComment.rejected, (state, action) => {
            state.status = "rejected"
            state.err = action.payload
        })
    }
})

export const { addComment, setCommentPage } = commentSlice.actions

export const { reducer } = commentSlice