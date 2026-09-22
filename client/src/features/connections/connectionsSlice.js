import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

const initialState = {
    connections: [],
    pendingConnections: [],
    followers: [],
    following: [],
    loading: false,
    error: null
};

export const fetchConnections = createAsyncThunk(
    'connections/fetchConnections',

    async (token, { rejectWithValue }) => {
        try {
            const { data } = await api.get(
                '/api/user/connections',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (data.success) {
                return data;
            }

            return rejectWithValue(
                data.message || 'Failed to fetch connections'
            );

        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message
            );
        }
    }
);

const connectionsSlice = createSlice({

    name: 'connections',

    initialState,

    reducers: {},

    extraReducers: (builder) => {

        builder.addCase(
            fetchConnections.pending,
            (state) => {
                state.loading = true;
                state.error = null;
            }
        );

        builder.addCase(
            fetchConnections.fulfilled,
            (state, action) => {

                const data = action.payload;

                state.loading = false;

                state.connections =
                    data.connections || [];

                state.pendingConnections =
                    data.pendingConnections || [];

                state.followers =
                    data.followers || [];

                state.following =
                    data.following || [];
            }
        );

        builder.addCase(
            fetchConnections.rejected,
            (state, action) => {

                state.loading = false;

                state.error =
                    action.payload || 'Failed to fetch connections';

                state.connections = [];
                state.pendingConnections = [];
                state.followers = [];
                state.following = [];
            }
        );
    }
});

export default connectionsSlice.reducer;