import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../api/axios'

const RecentMessages = () => {

    const { user } = useSelector((state) => state.user)

    const [messages, setMessages] = useState([])


    const fetchRecentMessages = async () => {

        try {

            const token = localStorage.getItem('token')

            if (!token) return


            const { data } = await api.get(
                '/api/user/recent-messages',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )


            if (data.success) {

                setMessages(data.messages || [])

            }

        } catch (error) {

            console.log(
                'Recent messages error:',
                error.response?.data || error.message
            )

        }

    }


    useEffect(() => {

        fetchRecentMessages()


        const interval = setInterval(() => {

            fetchRecentMessages()

        }, 30000)


        return () => clearInterval(interval)

    }, [])


    // Get latest message for each conversation
    const conversations = {}


    messages.forEach((message) => {

        const fromId =
            message.from_user_id?._id ||
            message.from_user_id

        const toId =
            message.to_user_id?._id ||
            message.to_user_id


        const currentUserId =
            user?._id ||
            user?.id


        let otherUser


        if (String(fromId) === String(currentUserId)) {

            otherUser = message.to_user_id

        } else {

            otherUser = message.from_user_id

        }


        if (!otherUser) return


        const otherUserId =
            otherUser._id ||
            otherUser


        if (!conversations[otherUserId]) {

            conversations[otherUserId] = {
                message,
                otherUser
            }

        }

    })


    const recentConversations =
        Object.values(conversations)


    return (

        <div className="w-full">

            <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Recent Messages
            </h2>


            <div className="space-y-2">

                {recentConversations.length === 0 ? (

                    <p className="text-sm text-slate-500">
                        No recent messages
                    </p>

                ) : (

                    recentConversations.map(
                        ({ message, otherUser }) => {

                            const otherUserId =
                                otherUser?._id ||
                                otherUser


                            const fullName =
                                otherUser?.full_name ||
                                'User'


                            const profilePicture =
                                otherUser?.profile_picture


                            const firstLetter =
                                fullName
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase() || '?'


                            let previewText = 'Message'


                            if (message.message_type === 'post') {

                                previewText = 'Shared a post'

                            } else if (
                                message.message_type === 'image'
                            ) {

                                previewText = 'Image'

                            } else if (
                                message.message_type === 'document'
                            ) {

                                previewText = 'Document'

                            } else if (message.text) {

                                previewText = message.text

                            }


                            return (

                                <Link
                                    key={message._id}
                                    to={`/messages/${otherUserId}`}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition"
                                >

                                    {/* Profile Picture / First Letter */}

                                    {profilePicture ? (

                                        <img
                                            src={profilePicture}
                                            alt={fullName}
                                            className="w-11 h-11 rounded-full object-cover"
                                        />

                                    ) : (

                                        <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-lg">
                                            {firstLetter}
                                        </div>

                                    )}


                                    {/* User Details */}

                                    <div className="flex-1 min-w-0">

                                        <p className="font-medium text-slate-800">
                                            {fullName}
                                        </p>


                                        <p className="text-sm text-slate-500 truncate">

                                            {previewText}

                                        </p>

                                    </div>


                                    {/* Unread Count */}

                                    {!message.seen &&
                                        String(
                                            message.to_user_id?._id ||
                                            message.to_user_id
                                        ) ===
                                        String(
                                            user?._id ||
                                            user?.id
                                        ) && (

                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs">

                                                1

                                            </span>

                                        )}

                                </Link>

                            )

                        }
                    )

                )}

            </div>

        </div>

    )

}


export default RecentMessages