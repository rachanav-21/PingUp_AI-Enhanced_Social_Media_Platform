import React, { useEffect, useRef, useState } from 'react'
import {
  ImageIcon,
  Paperclip,
  SendHorizontal,
  Share2
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import {
  addMessage,
  fetchMessages,
  resetMessages
} from '../features/messages/messagesSlice'
import toast from 'react-hot-toast'

const ChatBox = () => {

  const { messages } = useSelector(
    (state) => state.messages
  )

  const { userId } = useParams()

  const dispatch = useDispatch()

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [document, setDocument] = useState(null)

  const messagesEndRef = useRef(null)

  const connections = useSelector(
    (state) => state.connections.connections
  )

  const currentUser = useSelector(
    (state) => state.user.value
  )

  const user = connections?.find(
    (connection) =>
      String(connection._id) === String(userId)
  )


  // Get ID from string OR populated object
  const getUserId = (value) => {

    if (!value) {
      return ''
    }

    if (typeof value === 'object') {
      return String(value._id || '')
    }

    return String(value)
  }


  // Fetch messages
  const fetchUserMessages = async () => {

    try {

      const token = localStorage.getItem('token')

      if (!token) {
        toast.error('Please login again')
        return
      }

      dispatch(
        fetchMessages({
          token,
          userId
        })
      )

    } catch (error) {

      toast.error(error.message)

    }
  }


  // Send normal message
  const sendMessage = async () => {

    if (!text.trim() && !image && !document) {
      return
    }

    try {

      const token = localStorage.getItem('token')

      if (!token) {
        toast.error('Please login again')
        return
      }

      const formData = new FormData()

      formData.append(
        'to_user_id',
        userId
      )

      formData.append(
        'text',
        text.trim()
      )

      if (image) {
        formData.append(
          'image',
          image
        )
      }

      if (document) {
        formData.append(
          'document',
          document
        )
      }

      const { data } = await api.post(
        '/api/message/send',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {

        setText('')
        setImage(null)
        setDocument(null)

        dispatch(
          addMessage(data.message)
        )

      } else {

        throw new Error(
          data.message
        )

      }

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Failed to send message'
      )

    }
  }


  // Fetch messages when opening chat
  useEffect(() => {

    if (userId) {
      fetchUserMessages()
    }

    return () => {
      dispatch(resetMessages())
    }

  }, [userId])


  // Scroll to latest message
  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })

  }, [messages])


  return (
    <div className='flex flex-col h-screen bg-slate-50'>

      {/* Chat Header */}

      <div className='flex items-center gap-3 p-3 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300'>

        {user?.profile_picture ? (

          <img
            src={user.profile_picture}
            alt=''
            className='size-9 rounded-full object-cover'
          />

        ) : (

          <div className='size-9 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-semibold'>

            {user?.full_name
              ?.charAt(0)
              ?.toUpperCase() || '?'}

          </div>

        )}

        <div>

          <p className='font-medium text-slate-800'>
            {user?.full_name || 'Chat'}
          </p>

          {user?.username && (

            <p className='text-sm text-gray-500'>
              @{user.username}
            </p>

          )}

        </div>

      </div>


      {/* Messages */}

      <div className='p-5 md:px-10 flex-1 overflow-y-scroll'>

        <div className='space-y-4 max-w-4xl mx-auto'>

          {messages
            ?.toSorted(
              (a, b) =>
                new Date(a.createdAt) -
                new Date(b.createdAt)
            )
            .map((message, index) => {

              const fromUserId = getUserId(
                message.from_user_id
              )

              const toUserId = getUserId(
                message.to_user_id
              )

              const currentUserId = getUserId(
                currentUser?._id
              )

              const isSent =
                fromUserId === currentUserId


              return (

                <div
                  key={message._id || index}
                  className={`flex flex-col ${
                    isSent
                      ? 'items-end'
                      : 'items-start'
                  }`}
                >

                  <div
                    className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${
                      isSent
                        ? 'rounded-br-none'
                        : 'rounded-bl-none'
                    }`}
                  >

                    {/* ========================= */}
                    {/* SHARED POST */}
                    {/* ========================= */}

                    {message.message_type === 'post' && (

                      <div className='rounded-lg border border-indigo-100 overflow-hidden bg-white'>

                        {/* Header */}

                        <div className='flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-100'>

                          <Share2 className='w-4 h-4 text-indigo-600' />

                          <span className='font-medium text-indigo-700'>
                            Shared Post
                          </span>

                        </div>


                        {/* ACTUAL POST IMAGE */}

                        {message.media_url ? (

                          <img
                            src={message.media_url}
                            alt='Shared post'
                            className='block w-full max-w-sm max-h-80 object-cover'
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />

                        ) : (

                          <div className='px-4 py-5 text-center text-sm text-gray-400'>
                            No image available
                          </div>

                        )}


                        {/* Post Caption */}

                        {message.text && (

                          <div className='px-3 py-2'>

                            <p className='text-sm text-slate-600 whitespace-pre-line'>
                              {message.text}
                            </p>

                          </div>

                        )}

                      </div>

                    )}


                    {/* ========================= */}
                    {/* IMAGE MESSAGE */}
                    {/* ========================= */}

                    {message.message_type === 'image' &&
                      message.media_url && (

                        <img
                          src={message.media_url}
                          className='block w-full max-w-sm rounded-lg'
                          alt='Image message'
                        />

                      )}


                    {/* ========================= */}
                    {/* DOCUMENT MESSAGE */}
                    {/* ========================= */}

                    {message.message_type === 'document' &&
                      message.media_url && (

                        <a
                          href={message.media_url}
                          target='_blank'
                          rel='noreferrer'
                          className='flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 mb-2 text-indigo-700 hover:bg-indigo-100'
                        >

                          <Paperclip size={16} />

                          <span className='font-medium'>
                            Open document
                          </span>

                        </a>

                      )}


                    {/* ========================= */}
                    {/* NORMAL TEXT */}
                    {/* ========================= */}

                    {message.message_type !== 'post' &&
                      message.message_type !== 'image' &&
                      message.message_type !== 'document' &&
                      message.text && (

                        <p className='whitespace-pre-line'>
                          {message.text}
                        </p>

                      )}

                  </div>

                </div>

              )

            })}

          <div ref={messagesEndRef} />

        </div>

      </div>


      {/* Message Input */}

      <div className='px-4 pb-5'>

        <div className='flex items-center gap-3 pl-5 p-2 bg-white w-full max-w-2xl mx-auto border border-gray-200 shadow rounded-full'>

          {/* Text input */}

          <input
            type='text'
            className='flex-1 outline-none text-slate-700 min-w-0'
            placeholder='Type a message...'
            onKeyDown={(e) => {

              if (e.key === 'Enter') {
                sendMessage()
              }

            }}
            onChange={(e) =>
              setText(e.target.value)
            }
            value={text}
          />


          {/* Image */}

          <label
            htmlFor='image'
            className='cursor-pointer'
          >

            {image ? (

              <img
                src={URL.createObjectURL(image)}
                alt=''
                className='h-8 w-8 rounded object-cover'
              />

            ) : (

              <ImageIcon className='size-6 text-gray-400' />

            )}

            <input
              type='file'
              id='image'
              accept='image/*'
              hidden
              onChange={(e) =>
                setImage(
                  e.target.files?.[0] || null
                )
              }
            />

          </label>


          {/* Document */}

          <label
            htmlFor='document'
            className='flex items-center gap-1 text-gray-400 cursor-pointer'
          >

            <Paperclip className='size-5' />

            {document && (

              <span className='text-xs max-w-20 truncate'>
                {document.name}
              </span>

            )}

            <input
              type='file'
              id='document'
              accept='.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx'
              hidden
              onChange={(e) =>
                setDocument(
                  e.target.files?.[0] || null
                )
              }
            />

          </label>


          {/* Send */}

          <button
            onClick={sendMessage}
            className='bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2.5 rounded-full'
          >

            <SendHorizontal size={18} />

          </button>

        </div>

      </div>

    </div>
  )
}

export default ChatBox