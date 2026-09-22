import React, { useEffect, useState } from 'react'
import {
  Eye,
  MessageSquare,
  ImageIcon,
  Paperclip,
  Share2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Messages = () => {

  const { connections } = useSelector(
    (state) => state.connections
  )

  const navigate = useNavigate()

  const [recentMessages, setRecentMessages] = useState([])

  const [loading, setLoading] = useState(true)


  // Fetch recent messages
  const fetchRecentMessages = async () => {

    try {

      const token = localStorage.getItem('token')

      if (!token) {
        toast.error('Please login again')
        return
      }

      const { data } = await api.get(
        '/api/message/recent',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {

        setRecentMessages(data.messages || [])

      } else {

        toast.error(data.message)

      }

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Failed to load recent messages'
      )

    } finally {

      setLoading(false)

    }
  }


  useEffect(() => {

    fetchRecentMessages()

  }, [])


  // Get latest message for a particular user
  const getLatestMessage = (userId) => {

    return recentMessages.find(
      (message) => {

        const fromUserId =
          String(
            message.from_user_id?._id ||
            message.from_user_id
          )

        const toUserId =
          String(
            message.to_user_id?._id ||
            message.to_user_id
          )

        return (
          fromUserId === String(userId) ||
          toUserId === String(userId)
        )

      }
    )
  }


  // Get message preview
  const getMessagePreview = (message) => {

    if (!message) {
      return 'Start a conversation'
    }

    if (message.message_type === 'post') {

      return (
        <span className='flex items-center gap-1 text-indigo-600'>
          <Share2 className='w-3.5 h-3.5' />
          Shared a post
        </span>
      )

    }

    if (message.message_type === 'image') {

      return (
        <span className='flex items-center gap-1 text-gray-500'>
          <ImageIcon className='w-3.5 h-3.5' />
          Image
        </span>
      )

    }

    if (message.message_type === 'document') {

      return (
        <span className='flex items-center gap-1 text-gray-500'>
          <Paperclip className='w-3.5 h-3.5' />
          Document
        </span>
      )

    }

    return message.text || 'Message'
  }


  const users = connections?.length > 0
    ? connections
    : []


  return (
    <div className='min-h-screen relative bg-slate-50'>

      <div className='max-w-6xl mx-auto p-6'>

        {/* Title */}

        <div className='mb-8'>

          <h1 className='text-3xl font-bold text-slate-900 mb-2'>
            Messages
          </h1>

          <p className='text-slate-600'>
            Talk to your friends and family
          </p>

        </div>


        {/* Loading */}

        {loading ? (

          <div className='bg-white rounded-xl shadow p-8 text-center max-w-xl'>

            <p className='text-sm text-gray-500'>
              Loading messages...
            </p>

          </div>

        ) : users.length > 0 ? (

          <div className='flex flex-col gap-3'>

            {users.map((user) => {

              const latestMessage =
                getLatestMessage(user._id)

              return (

                <div
                  key={user._id}
                  className='max-w-xl flex flex-wrap items-center gap-5 p-6 bg-white shadow rounded-md'
                >

                  {/* Profile Picture */}

                  {user.profile_picture ? (

                    <img
                      src={user.profile_picture}
                      alt={user.full_name || 'Profile'}
                      className='rounded-full size-12 object-cover'
                    />

                  ) : (

                    <div className='rounded-full size-12 bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-lg uppercase'>
                      {user.full_name?.trim()?.charAt(0) || '?'}
                    </div>

                  )}


                  {/* User Details */}

                  <div className='flex-1 min-w-0'>

                    <p className='font-medium text-slate-700'>
                      {user.full_name}
                    </p>

                    <p className='text-slate-500'>
                      @{user.username}
                    </p>

                    {latestMessage ? (

                      <div className='text-sm mt-1 truncate'>

                        {getMessagePreview(
                          latestMessage
                        )}

                      </div>

                    ) : user.bio ? (

                      <p className='text-sm text-gray-600 truncate'>
                        {user.bio}
                      </p>

                    ) : (

                      <p className='text-sm text-gray-400'>
                        No messages yet
                      </p>

                    )}

                  </div>


                  {/* Buttons */}

                  <div className='flex gap-2'>

                    {/* Message */}

                    <button
                      onClick={() =>
                        navigate(
                          `/messages/${user._id}`
                        )
                      }
                      className='size-10 flex items-center justify-center text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer'
                      title='Send message'
                    >

                      <MessageSquare className='w-4 h-4' />

                    </button>


                    {/* Profile */}

                    <button
                      onClick={() =>
                        navigate(
                          `/profile/${user._id}`
                        )
                      }
                      className='size-10 flex items-center justify-center text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer'
                      title='View profile'
                    >

                      <Eye className='w-4 h-4' />

                    </button>

                  </div>

                </div>

              )

            })}

          </div>

        ) : (

          <div className='bg-white rounded-xl shadow p-8 text-center max-w-xl'>

            <MessageSquare className='w-10 h-10 mx-auto text-slate-400 mb-3' />

            <h2 className='text-lg font-semibold text-slate-700'>
              No connections yet
            </h2>

            <p className='text-sm text-slate-500 mt-1'>
              Connect with people first to start messaging them.
            </p>

            <button
              onClick={() =>
                navigate('/connections')
              }
              className='mt-5 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition cursor-pointer'
            >
              Find Connections
            </button>

          </div>

        )}

      </div>

    </div>
  )
}

export default Messages