import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'
import { dummyUserData } from '../../assets/assets'


const initialState = {
    value: dummyUserData
}

export const fetchUser = createAsyncThunk('user/fetchUser', async (token) => {
    try {
        const { data } = await api.get('/api/user/data', {
            headers: {Authorization: `Bearer ${token}`}
        })
        return data.success ? data.user : dummyUserData
    } catch (error) {
        return dummyUserData
    }
})

export const updateUser = createAsyncThunk('user/update', async ({userData ,token}) => {
    const { data } = await api.post('/api/user/update', userData, {
        headers: {Authorization: `Bearer ${token}`}
    })
    if(data.success){
        toast.success(data.message)
        return data.user
    }else{
        toast.error(data.message)
        return null
    }
})


const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {

    },
    extraReducers: (builder)=>{
        builder.addCase(fetchUser.fulfilled, (state, action)=>{
            state.value = action.payload || dummyUserData
        }).addCase(fetchUser.rejected, (state)=>{
            state.value = dummyUserData
        }).addCase(updateUser.fulfilled, (state, action)=>{
            state.value = action.payload || dummyUserData
        })
    }
})

export default userSlice.reducer