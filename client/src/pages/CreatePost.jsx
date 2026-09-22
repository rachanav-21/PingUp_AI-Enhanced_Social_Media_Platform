import React, { useState } from 'react'
import {
  Image,
  X,
  Sparkles,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'

const CreatePost = () => {

  const navigate = useNavigate()

  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [captions, setCaptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [publishAt, setPublishAt] = useState('')

  const [aiLoadingIndex, setAiLoadingIndex] = useState(null)
  const [aiSuggestions, setAiSuggestions] = useState({})

  const user = useSelector((state) => state.user.value)

  const getToken = () => {
    return localStorage.getItem('token')
  }

  // =====================================================
  // SELECT IMAGES / VIDEOS
  // =====================================================

  const handleImages = (e) => {

    const selectedFiles = Array.from(e.target.files)

    if (!selectedFiles.length) {
      return
    }

    const remainingSlots = 5 - images.length

    if (remainingSlots <= 0) {
      toast.error('You can upload maximum 5 media files')
      e.target.value = ''
      return
    }

    const filesToAdd = selectedFiles.slice(
      0,
      remainingSlots
    )

    if (selectedFiles.length > remainingSlots) {
      toast.error('Maximum 5 media files allowed')
    }

    setImages((prevImages) => [
      ...prevImages,
      ...filesToAdd
    ])

    setCaptions((prevCaptions) => [
      ...prevCaptions,
      ...filesToAdd.map(() => '')
    ])

    e.target.value = ''
  }

  // =====================================================
  // REMOVE IMAGE / VIDEO
  // =====================================================

  const removeImage = (index) => {

    setImages((prevImages) =>
      prevImages.filter((_, i) => i !== index)
    )

    setCaptions((prevCaptions) =>
      prevCaptions.filter((_, i) => i !== index)
    )

    setAiSuggestions((prevSuggestions) => {

      const updatedSuggestions = {
        ...prevSuggestions
      }

      delete updatedSuggestions[index]

      return updatedSuggestions
    })
  }

  // =====================================================
  // CHANGE CAPTION
  // =====================================================

  const handleCaptionChange = (index, value) => {

    setCaptions((prevCaptions) => {

      const updatedCaptions = [
        ...prevCaptions
      ]

      updatedCaptions[index] = value

      return updatedCaptions
    })
  }

  // =====================================================
  // GENERATE AI CAPTIONS
  // =====================================================

  const generateCaptions = async (index) => {

    const media = images[index]

    if (!media) {
      toast.error('Please select an image or video first')
      return
    }

    const token = getToken()

    if (!token) {
      toast.error('Please login again')
      navigate('/login')
      return
    }

    const isVideo = media.type.startsWith('video/')

    if (
      isVideo &&
      media.size > 20 * 1024 * 1024
    ) {
      toast.error(
        'Video must be smaller than 20MB for AI captions'
      )
      return
    }

    setAiLoadingIndex(index)

    try {

      const formData = new FormData()

      formData.append(
        'media',
        media
      )

      console.log('AI Caption: sending media', {
        name: media.name,
        type: media.type,
        size: `${(media.size / 1024 / 1024).toFixed(2)} MB`
      })

      const response = await api.post(
        '/api/post/ai-caption',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: isVideo
            ? 120000
            : 60000
        }
      )

      console.log(
        'AI Caption Response:',
        response.data
      )

      const data = response.data

      if (data.success) {

        const receivedCaptions =
          Array.isArray(data.captions)
            ? data.captions
            : []

        setAiSuggestions((prevSuggestions) => ({
          ...prevSuggestions,
          [index]: receivedCaptions
        }))

        if (receivedCaptions.length > 0) {

          toast.success(
            'AI captions generated!'
          )

        } else {

          toast.error(
            'AI did not generate any captions'
          )
        }

      } else {

        throw new Error(
          data.message ||
          'Failed to generate captions'
        )
      }

    } catch (error) {

      console.error(
        'AI Caption Error:',
        error
      )

      console.error(
        'AI Caption Server Response:',
        error.response?.data
      )

      console.error(
        'AI Caption Status:',
        error.response?.status
      )

      if (
        error.response?.status === 401
      ) {

        toast.error(
          'Session expired. Please login again.'
        )

        localStorage.removeItem('token')

        navigate('/login')

      } else if (
        error.response?.status === 503
      ) {

        const serverMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          'AI service is temporarily busy. Please try again in a few seconds.'

        toast.error(
          serverMessage,
          {
            duration: 6000
          }
        )

      } else if (
        error.response?.status === 429
      ) {

        toast.error(
          'AI request limit reached. Please wait a little and try again.',
          {
            duration: 6000
          }
        )

      } else if (
        error.code === 'ECONNABORTED'
      ) {

        toast.error(
          isVideo
            ? 'Video analysis is taking too long. Try a smaller video.'
            : 'AI analysis timed out. Please try again.',
          {
            duration: 6000
          }
        )

      } else {

        const serverMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Failed to generate AI captions'

        toast.error(
          serverMessage,
          {
            duration: 6000
          }
        )
      }

    } finally {

      setAiLoadingIndex(null)
    }
  }

  // =====================================================
  // USE AI CAPTION
  // =====================================================

  const useAICaption = (index, caption) => {

    handleCaptionChange(
      index,
      caption
    )

    toast.success(
      'Caption added! You can edit it.'
    )
  }

  // =====================================================
  // SUBMIT POST
  // =====================================================

  const handleSubmit = async () => {

    if (
      !images.length &&
      !content.trim()
    ) {

      toast.error(
        'Please add at least one image or text'
      )

      return
    }

    const token = getToken()

    if (!token) {

      toast.error(
        'Please login again'
      )

      navigate('/login')

      return
    }

    setLoading(true)

    const postType =
      images.length && content.trim()
        ? 'text_with_image'
        : images.length
          ? 'image'
          : 'text'

    try {

      const formData = new FormData()

      formData.append(
        'content',
        content
      )

      formData.append(
        'post_type',
        postType
      )

      if (publishAt) {

        formData.append(
          'publishAt',
          new Date(
            publishAt
          ).toISOString()
        )
      }

      images.forEach((image) => {

        formData.append(
          'images',
          image
        )
      })

      formData.append(
        'captions',
        JSON.stringify(captions)
      )

      const { data } = await api.post(
        '/api/post/add',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {

        toast.success(
          'Post Added'
        )

        setContent('')
        setImages([])
        setCaptions([])
        setPublishAt('')
        setAiSuggestions({})

        navigate('/')

      } else {

        throw new Error(
          data.message ||
          'Post not added'
        )
      }

    } catch (error) {

      console.error(
        'Create Post Error:',
        error
      )

      if (
        error.response?.status === 401
      ) {

        toast.error(
          'Session expired. Please login again.'
        )

        localStorage.removeItem('token')

        navigate('/login')

      } else {

        toast.error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Post not added'
        )
      }

    } finally {

      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>

      <div className='max-w-6xl mx-auto p-6'>

        <div className='mb-8'>

          <h1 className='text-3xl font-bold text-slate-900 mb-2'>
            Create Post
          </h1>

          <p className='text-slate-600'>
            Share your thoughts with the world
          </p>

        </div>

        <div className='max-w-xl bg-white p-4 sm:p-8 sm:pb-3 rounded-xl shadow-md space-y-4'>

          <div className='flex items-center gap-3'>

            {user?.profile_picture ? (

              <img
                src={user.profile_picture}
                alt=''
                className='w-12 h-12 rounded-full shadow object-cover'
              />

            ) : (

              <div className='w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500'>

                {user?.full_name
                  ?.charAt(0)
                  ?.toUpperCase() || 'U'}

              </div>

            )}

            <div>

              <h2 className='font-semibold'>
                {user?.full_name || 'User'}
              </h2>

              <p className='text-sm text-gray-500'>
                {user?.username
                  ? `@${user.username}`
                  : ''}
              </p>

            </div>

          </div>

          <textarea
            className='w-full resize-none max-h-20 mt-4 text-sm outline-none placeholder-gray-400'
            placeholder="What's happening?"
            onChange={(e) =>
              setContent(e.target.value)
            }
            value={content}
          />

          {images.length > 0 && (

            <div className='space-y-4 mt-4'>

              {images.map((media, i) => {

                const isVideo =
                  media.type.startsWith('video/')

                const suggestions =
                  aiSuggestions[i] || []

                return (

                  <div
                    key={i}
                    className='border border-gray-200 rounded-lg p-3'
                  >

                    <div className='relative group w-fit'>

                      {isVideo ? (

                        <video
                          src={URL.createObjectURL(media)}
                          className='h-40 w-auto max-w-full rounded-md object-cover'
                          controls
                        />

                      ) : (

                        <img
                          src={URL.createObjectURL(media)}
                          className='h-40 w-auto max-w-full rounded-md object-cover'
                          alt=''
                        />

                      )}

                      <button
                        type='button'
                        onClick={() =>
                          removeImage(i)
                        }
                        className='absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-1 text-white'
                      >

                        <X className='w-4 h-4' />

                      </button>

                    </div>

                    <button
                      type='button'
                      onClick={() =>
                        generateCaptions(i)
                      }
                      disabled={
                        aiLoadingIndex === i
                      }
                      className='mt-3 flex items-center gap-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-2 rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed'
                    >

                      {aiLoadingIndex === i ? (

                        <>
                          <Loader2 className='w-4 h-4 animate-spin' />
                          Analyzing media...
                        </>

                      ) : (

                        <>
                          <Sparkles className='w-4 h-4' />
                          AI Caption
                        </>

                      )}

                    </button>

                    {suggestions.length > 0 && (

                      <div className='mt-3 rounded-lg bg-purple-50 border border-purple-100 p-3'>

                        <div className='flex items-center gap-2 mb-2'>

                          <Sparkles className='w-4 h-4 text-purple-600' />

                          <p className='text-sm font-semibold text-purple-900'>
                            AI Caption Suggestions
                          </p>

                        </div>

                        <div className='space-y-2'>

                          {suggestions.map(
                            (suggestion, suggestionIndex) => (

                              <button
                                key={suggestionIndex}
                                type='button'
                                onClick={() =>
                                  useAICaption(
                                    i,
                                    suggestion
                                  )
                                }
                                className='w-full text-left bg-white hover:bg-purple-100 border border-purple-100 rounded-md px-3 py-2 text-sm text-gray-700 transition'
                              >

                                {suggestion}

                              </button>

                            )
                          )}

                        </div>

                        <p className='text-xs text-purple-600 mt-2'>
                          Click a caption to use it. You can edit it before publishing.
                        </p>

                      </div>

                    )}

                    <input
                      type='text'
                      value={
                        captions[i] || ''
                      }
                      onChange={(e) =>
                        handleCaptionChange(
                          i,
                          e.target.value
                        )
                      }
                      placeholder={
                        isVideo
                          ? `Caption for video ${i + 1}`
                          : `Caption for image ${i + 1}`
                      }
                      className='w-full mt-3 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-400'
                    />

                  </div>

                )
              })}

            </div>

          )}

          <div className='rounded-lg border border-indigo-100 bg-indigo-50 p-3'>

            <div className='flex items-center justify-between gap-3'>

              <div>

                <p className='text-sm font-semibold text-indigo-900'>
                  PingUp Time Capsule
                </p>

                <p className='text-xs text-indigo-700'>
                  Choose when this post should appear in your feed.
                </p>

              </div>

              <input
                type='datetime-local'
                value={publishAt}
                min={
                  new Date(
                    Date.now() + 60000
                  )
                    .toISOString()
                    .slice(0, 16)
                }
                onChange={(e) =>
                  setPublishAt(
                    e.target.value
                  )
                }
                className='border border-indigo-200 rounded-md px-2 py-1 text-xs bg-white'
              />

            </div>

            {publishAt && (

              <button
                type='button'
                onClick={() =>
                  setPublishAt('')
                }
                className='text-xs text-indigo-600 mt-2 hover:underline'
              >
                Publish now instead
              </button>

            )}

          </div>

          <div className='flex items-center justify-between pt-3 border-t border-gray-300'>

            <label
              htmlFor='images'
              className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer'
            >

              <Image className='size-6' />

            </label>

            <input
              type='file'
              id='images'
              accept='image/*,video/*'
              hidden
              multiple
              onChange={handleImages}
            />

            <button
              disabled={loading}
              onClick={handleSubmit}
              className='text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-50'
            >

              {loading
                ? 'Uploading...'
                : 'Publish Post'}

            </button>

          </div>

        </div>

      </div>

    </div>
  )
}

export default CreatePost