import React from 'react'
import { MapPin, MessageCircle, Plus, UserPlus } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { fetchUser } from '../features/user/userSlice'

const UserCard = ({ user }) => {

    const currentUser = useSelector((state) => state.user.value)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const getToken = async () => {
        return localStorage.getItem('token')
    }

    // Safe arrays
    const followers = Array.isArray(user?.followers)
        ? user.followers
        : []

    const following = Array.isArray(currentUser?.following)
        ? currentUser.following
        : []

    const connections = Array.isArray(currentUser?.connections)
        ? currentUser.connections
        : []

    // Check if current user is following this user
    const isFollowing = following.some(
        (id) => String(id?._id || id) === String(user?._id)
    )

    // Check if already connected
    const isConnected = connections.some(
        (id) => String(id?._id || id) === String(user?._id)
    )

    // =====================================================
    // FOLLOW USER
    // =====================================================

    const handleFollow = async () => {
        try {

            const token = await getToken()

            if (!token) {
                toast.error('Please login again')
                return
            }

            if (!user?._id) {
                toast.error('User ID not found')
                return
            }

            const { data } = await api.post(
                '/api/user/follow',
                {
                    userId: user._id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (data.success) {

                toast.success(data.message)

                dispatch(fetchUser(token))

            } else {

                toast.error(data.message)

            }

        } catch (error) {

            console.error('FOLLOW ERROR:', error)

            toast.error(
                error.response?.data?.message ||
                error.message ||
                'Failed to follow user'
            )
        }
    }

    // =====================================================
    // CONNECTION REQUEST
    // =====================================================

    const handleConnectionRequest = async () => {

        // Already connected → open messages
        if (isConnected) {
            navigate('/messages/' + user._id)
            return
        }

        try {

            const token = await getToken()

            if (!token) {
                toast.error('Please login again')
                return
            }

            if (!user?._id) {
                toast.error('User ID not found')
                return
            }

            const { data } = await api.post(
                '/api/user/connect',
                {
                    userId: user._id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (data.success) {

                toast.success(data.message)

            } else {

                toast.error(data.message)

            }

        } catch (error) {

            console.error('CONNECTION ERROR:', error)

            toast.error(
                error.response?.data?.message ||
                error.message ||
                'Failed to send connection request'
            )
        }
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <div
            key={user?._id}
            className="p-4 pt-6 flex flex-col justify-between w-72 shadow border border-gray-200 rounded-md bg-white"
        >

            {/* USER INFORMATION */}

            <div className="text-center">

                {user?.profile_picture ? (

                    <img
                        src={user.profile_picture}
                        alt={user?.full_name || 'User'}
                        className="rounded-full w-16 h-16 object-cover shadow-md mx-auto"
                    />

                ) : (

                    <div className="rounded-full w-16 h-16 shadow-md mx-auto bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-semibold">
                        {(user?.full_name || user?.username || 'U')
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                )}

                <p className="mt-4 font-semibold">
                    {user?.full_name || 'User'}
                </p>

                {user?.username && (
                    <p className="text-gray-500 font-light">
                        @{user.username}
                    </p>
                )}

                {user?.bio && (
                    <p className="text-gray-600 mt-2 text-center text-sm px-4">
                        {user.bio}
                    </p>
                )}

            </div>

            {/* USER STATS */}

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">

                {user?.location && (
                    <div className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1 max-w-[130px]">
                        <MapPin className="w-4 h-4 flex-shrink-0" />

                        <span className="truncate">
                            {user.location}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1">
                    <span>
                        {followers.length}
                    </span>

                    Followers
                </div>

            </div>

            {/* BUTTONS */}

            <div className="flex mt-4 gap-2">

                {/* FOLLOW BUTTON */}

                <button
                    onClick={handleFollow}
                    disabled={isFollowing}
                    className={`w-full py-2 rounded-md flex justify-center items-center gap-2 transition text-white ${
                        isFollowing
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 cursor-pointer'
                    }`}
                >

                    <UserPlus className="w-4 h-4" />

                    {isFollowing
                        ? 'Following'
                        : 'Follow'
                    }

                </button>

                {/* CONNECTION / MESSAGE BUTTON */}

                <button
                    onClick={handleConnectionRequest}
                    className="flex items-center justify-center w-16 border text-slate-500 group rounded-md cursor-pointer active:scale-95 transition hover:bg-slate-50"
                >

                    {isConnected ? (

                        <MessageCircle className="w-5 h-5 group-hover:scale-105 transition" />

                    ) : (

                        <Plus className="w-5 h-5 group-hover:scale-105 transition" />

                    )}

                </button>

            </div>

        </div>
    )
}

export default UserCard