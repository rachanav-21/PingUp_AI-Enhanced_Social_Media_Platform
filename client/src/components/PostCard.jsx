import React, {
  useEffect,
  useState
} from 'react'

import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Send,
  X,
  Smile,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import moment from 'moment'

import {
  useNavigate
} from 'react-router-dom'

import {
  useSelector
} from 'react-redux'

import api from '../api/axios'

import toast from 'react-hot-toast'


const PostCard = ({
  post,
  onDeleted
}) => {

  // =====================================================
  // OLD LIKE STATE
  // =====================================================

  const initialLikes =
    Array.isArray(
      post.likes_count
    )
      ? post.likes_count
      : []

  const initialLikeCount =
    typeof post.likes_count ===
    'number'
      ? post.likes_count
      : initialLikes.length

  const [
    likes,
    setLikes
  ] = useState(
    initialLikes
  )

  const [
    likeCount,
    setLikeCount
  ] = useState(
    initialLikeCount
  )


  // =====================================================
  // NEW REACTION STATE
  // =====================================================

  const [
    showReactionPicker,
    setShowReactionPicker
  ] = useState(false)

  const [
    userReaction,
    setUserReaction
  ] = useState(
    post.userReaction ||
    null
  )

  const [
    reactionCounts,
    setReactionCounts
  ] = useState(
    post.reactionCounts || {
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0
    }
  )


  // =====================================================
  // COMMENTS STATE
  // =====================================================

  const [
    comments,
    setComments
  ] = useState([])

  const [
    commentCount,
    setCommentCount
  ] = useState(
    post.comments_count ||
    0
  )

  const [
    showComments,
    setShowComments
  ] = useState(false)

  const [
    commentText,
    setCommentText
  ] = useState('')

  const [
    loadingComments,
    setLoadingComments
  ] = useState(false)

  const [
    showEmojiPicker,
    setShowEmojiPicker
  ] = useState(false)


  // =====================================================
  // SHARE STATE
  // =====================================================

  const [
    showShareModal,
    setShowShareModal
  ] = useState(false)

  const [
    sendingTo,
    setSendingTo
  ] = useState(null)


  // =====================================================
  // MEDIA CAROUSEL STATE
  // =====================================================

  const [
    currentImage,
    setCurrentImage
  ] = useState(0)

  const [
    touchStart,
    setTouchStart
  ] = useState(null)

  const [
    touchEnd,
    setTouchEnd
  ] = useState(null)


  // =====================================================
  // REDUX
  // =====================================================

  const currentUser =
    useSelector(
      (state) =>
        state.user.value
    )

  const connections =
    useSelector(
      (state) =>
        state.connections.connections
    )

  const followers =
    useSelector(
      (state) =>
        state.connections.followers
    )

  const following =
    useSelector(
      (state) =>
        state.connections.following
    )


  // =====================================================
  // NAVIGATION
  // =====================================================

  const navigate =
    useNavigate()


  const currentUserId =
    String(
      currentUser?._id || ''
    )


  // =====================================================
  // POST USER INFORMATION
  // =====================================================

  const postUser =
    typeof post.user ===
      'object' &&
    post.user !== null
      ? post.user
      : null

  const postUserId =
    String(
      postUser?._id ||
      post.user ||
      ''
    )

  const postUsername =
    postUser?.username ||
    ''

  const postFullName =
    postUser?.full_name ||
    postUser?.name ||
    postUsername ||
    'User'

  const postProfilePicture =
    postUser?.profile_picture ||
    postUser?.profilePic ||
    postUser?.image ||
    ''


  // =====================================================
  // LIKE CHECK
  // =====================================================

  const isLiked =
    Array.isArray(likes)
      ? likes.some(
          (id) =>
            String(
              id?._id ||
              id
            ) ===
            currentUserId
        )
      : false


  // =====================================================
  // POST OWNER
  // =====================================================

  const isOwner =
    postUserId ===
    currentUserId


  // =====================================================
  // COMMENT EMOJIS
  // =====================================================

  const emojis = [
    '😀',
    '😂',
    '😍',
    '🥰',
    '😊',
    '😎',
    '😭',
    '😢',
    '😡',
    '👍',
    '👏',
    '❤️',
    '🔥',
    '🎉',
    '💯',
    '🙌',
    '🤗',
    '😘',
    '🤣',
    '😇'
  ]


  // =====================================================
  // POST REACTIONS
  // =====================================================

  const reactions = [
    {
      type: 'love',
      emoji: '❤️',
      label: 'Love'
    },

    {
      type: 'haha',
      emoji: '😂',
      label: 'Haha'
    },

    {
      type: 'wow',
      emoji: '😍',
      label: 'Wow'
    },

    {
      type: 'sad',
      emoji: '😢',
      label: 'Sad'
    },

    {
      type: 'angry',
      emoji: '😡',
      label: 'Angry'
    }
  ]


  // =====================================================
  // UPDATE OLD LIKES
  // =====================================================

  useEffect(() => {

    const newLikes =
      Array.isArray(
        post.likes_count
      )
        ? post.likes_count
        : []

    const newLikeCount =
      typeof post.likes_count ===
      'number'
        ? post.likes_count
        : newLikes.length

    setLikes(
      newLikes
    )

    setLikeCount(
      newLikeCount
    )

  }, [
    post.likes_count
  ])


  // =====================================================
  // UPDATE REACTIONS
  // =====================================================

  useEffect(() => {

    setUserReaction(
      post.userReaction ||
      null
    )

    setReactionCounts(
      post.reactionCounts || {
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0
      }
    )

  }, [
    post.userReaction,
    post.reactionCounts
  ])


  // =====================================================
  // UPDATE COMMENTS COUNT
  // =====================================================

  useEffect(() => {

    setCommentCount(
      post.comments_count ||
      0
    )

  }, [
    post.comments_count
  ])


  // =====================================================
  // RESET CAROUSEL
  // =====================================================

  useEffect(() => {

    setCurrentImage(0)

  }, [
    post._id
  ])


  // =====================================================
  // MEDIA HELPER
  // =====================================================

  const getMediaUrl = (
    media
  ) => {

    if (
      typeof media ===
      'string'
    ) {
      return media
    }

    if (
      media &&
      typeof media ===
      'object'
    ) {

      return (
        media.url ||
        media.src ||
        media.media_url ||
        media.image_url ||
        media.video_url ||
        ''
      )
    }

    return ''
  }


  // =====================================================
  // VIDEO DETECTION
  // =====================================================

  const isVideoMedia = (
    media
  ) => {

    if (
      !media
    ) {
      return false
    }

    // ---------------------------------------------
    // Check explicit media type fields
    // ---------------------------------------------

    if (
      typeof media ===
      'object'
    ) {

      const mediaType =
        String(
          media.type ||
          media.media_type ||
          media.file_type ||
          media.mimeType ||
          media.mime_type ||
          ''
        ).toLowerCase()

      if (
        mediaType.includes(
          'video'
        )
      ) {
        return true
      }

      if (
        mediaType.includes(
          'image'
        )
      ) {
        return false
      }
    }


    // ---------------------------------------------
    // Check URL extension
    // ---------------------------------------------

    const url =
      getMediaUrl(
        media
      )

    const cleanUrl =
      url
        .split('?')[0]
        .split('#')[0]
        .toLowerCase()

    const videoExtensions = [
      '.mp4',
      '.webm',
      '.mov',
      '.m4v',
      '.avi',
      '.mkv',
      '.ogv',
      '.3gp',
      '.mpeg',
      '.mpg'
    ]

    return videoExtensions.some(
      (extension) =>
        cleanUrl.endsWith(
          extension
        )
    )
  }


  // =====================================================
  // OPEN PROFILE
  // =====================================================

  const openPostUserProfile =
    () => {

      if (!postUserId) {

        toast.error(
          'User profile not available'
        )

        return
      }

      navigate(
        `/profile/${postUserId}`
      )
    }


  // =====================================================
  // ADD EMOJI
  // =====================================================

  const addEmoji =
    (emoji) => {

      setCommentText(
        (prev) =>
          prev + emoji
      )

      setShowEmojiPicker(
        false
      )
    }


  // =====================================================
  // NEXT MEDIA
  // =====================================================

  const goToNextImage =
    () => {

      if (
        !post.image_urls?.length
      ) {
        return
      }

      setCurrentImage(
        (prev) =>
          prev ===
          post.image_urls.length - 1
            ? 0
            : prev + 1
      )
    }


  // =====================================================
  // PREVIOUS MEDIA
  // =====================================================

  const goToPreviousImage =
    () => {

      if (
        !post.image_urls?.length
      ) {
        return
      }

      setCurrentImage(
        (prev) =>
          prev === 0
            ? post.image_urls.length - 1
            : prev - 1
      )
    }


  // =====================================================
  // TOUCH START
  // =====================================================

  const handleTouchStart =
    (e) => {

      setTouchEnd(null)

      setTouchStart(
        e.targetTouches[0]
          .clientX
      )
    }


  // =====================================================
  // TOUCH MOVE
  // =====================================================

  const handleTouchMove =
    (e) => {

      setTouchEnd(
        e.targetTouches[0]
          .clientX
      )
    }


  // =====================================================
  // TOUCH END
  // =====================================================

  const handleTouchEnd =
    () => {

      if (
        touchStart === null ||
        touchEnd === null
      ) {
        return
      }

      const distance =
        touchStart -
        touchEnd

      const minimumSwipeDistance =
        50

      if (
        Math.abs(distance) <
        minimumSwipeDistance
      ) {
        return
      }

      if (
        distance > 0
      ) {

        goToNextImage()

      } else {

        goToPreviousImage()
      }

      setTouchStart(null)
      setTouchEnd(null)
    }


  // =====================================================
  // OLD LIKE POST
  // =====================================================

  const handleLike =
    async () => {

      try {

        const { data } =
          await api.post(
            '/api/post/like',
            {
              postId:
                post._id
            }
          )

        if (!data.success) {

          return toast.error(
            data.message
          )
        }

        setLikeCount(
          typeof data.likes_count ===
          'number'
            ? data.likes_count
            : likeCount
        )

        setLikes(
          (prev) => {

            const safeLikes =
              Array.isArray(prev)
                ? prev
                : []

            const alreadyLiked =
              safeLikes.some(
                (id) =>
                  String(
                    id?._id ||
                    id
                  ) ===
                  currentUserId
              )

            if (
              alreadyLiked
            ) {

              return safeLikes.filter(
                (id) =>
                  String(
                    id?._id ||
                    id
                  ) !==
                  currentUserId
              )
            }

            return [
              ...safeLikes,
              currentUserId
            ]
          }
        )

        toast.success(
          data.message ||
          (
            data.liked
              ? 'Post liked'
              : 'Post unliked'
          )
        )

      } catch (error) {

        toast.error(
          error.response
            ?.data
            ?.message ||
          error.message
        )
      }
    }


  // =====================================================
  // NEW REACTION
  // =====================================================

  const handleReaction =
    async (
      reactionType
    ) => {

      try {

        const { data } =
          await api.post(
            '/api/post/react',
            {
              postId:
                post._id,

              reaction:
                reactionType
            }
          )

        if (
          !data.success
        ) {

          return toast.error(
            data.message
          )
        }

        setUserReaction(
          data.userReaction
        )

        setReactionCounts(
          data.reactionCounts ||
          {
            love: 0,
            haha: 0,
            wow: 0,
            sad: 0,
            angry: 0
          }
        )

        setShowReactionPicker(
          false
        )

      } catch (error) {

        toast.error(
          error.response
            ?.data
            ?.message ||
          error.message ||
          'Failed to react to post'
        )
      }
    }


  // =====================================================
  // TOTAL REACTIONS
  // =====================================================

  const totalReactions =
    Object.values(
      reactionCounts
    ).reduce(
      (
        total,
        count
      ) =>
        total + count,
      0
    )


  // =====================================================
  // CURRENT REACTION
  // =====================================================

  const currentReaction =
    reactions.find(
      (item) =>
        item.type ===
        userReaction
    )


  // =====================================================
  // LOAD COMMENTS
  // =====================================================

  const loadComments =
    async () => {

      if (
        showComments
      ) {

        setShowComments(
          false
        )

        return
      }

      setLoadingComments(
        true
      )

      try {

        const { data } =
          await api.get(
            `/api/post/comments/${post._id}`
          )

        if (
          data.success
        ) {

          setComments(
            data.comments ||
            []
          )

          setCommentCount(
            data.comments?.length ||
            0
          )

          setShowComments(
            true
          )

        } else {

          toast.error(
            data.message
          )
        }

      } catch (error) {

        toast.error(
          error.response
            ?.data
            ?.message ||
          error.message
        )

      } finally {

        setLoadingComments(
          false
        )
      }
    }


  // =====================================================
  // ADD COMMENT
  // =====================================================

  const handleComment =
    async (e) => {

      e.preventDefault()

      if (
        !commentText.trim()
      ) {
        return
      }

      try {

        const { data } =
          await api.post(
            '/api/post/comment',
            {
              postId:
                post._id,

              text:
                commentText.trim()
            }
          )

        if (
          data.success
        ) {

          setComments(
            (prev) => [
              data.comment,
              ...prev
            ]
          )

          setCommentCount(
            data.comments_count ??
            commentCount + 1
          )

          setCommentText(
            ''
          )

          setShowComments(
            true
          )

          setShowEmojiPicker(
            false
          )

        } else {

          toast.error(
            data.message
          )
        }

      } catch (error) {

        toast.error(
          error.response
            ?.data
            ?.message ||
          error.message
        )
      }
    }


  // =====================================================
  // DELETE COMMENT
  // =====================================================

  const handleDeleteComment =
    async (
      commentId
    ) => {

      if (
        !window.confirm(
          'Delete this comment? This cannot be undone.'
        )
      ) {
        return
      }

      try {

        const { data } =
          await api.delete(
            `/api/post/comment/${commentId}`
          )

        if (
          data.success
        ) {

          setComments(
            (prev) =>
              prev.filter(
                (comment) =>
                  comment._id !==
                  commentId
              )
          )

          setCommentCount(
            data.comments_count ??
            Math.max(
              0,
              commentCount - 1
            )
          )

          toast.success(
            'Comment deleted'
          )

        } else {

          toast.error(
            data.message
          )
        }

      } catch (error) {

        toast.error(
          error.response
            ?.data
            ?.message ||
          error.message
        )
      }
    }


  // =====================================================
  // SHARE POST
  // =====================================================

  const handleShare =
    () => {

      setShowShareModal(
        true
      )
    }


  // =====================================================
  // GET SHARE USERS
  // =====================================================

  const getShareUsers =
    () => {

      const allUsers = [
        ...(connections || []),
        ...(followers || []),
        ...(following || [])
      ]

      const uniqueUsers =
        allUsers.filter(
          (
            user,
            index,
            self
          ) =>
            user?._id &&
            index ===
            self.findIndex(
              (item) =>
                String(
                  item?._id
                ) ===
                String(
                  user?._id
                )
            )
        )

      return uniqueUsers.filter(
        (user) =>
          String(
            user._id
          ) !==
          currentUserId
      )
    }


  // =====================================================
  // SEND POST TO USER
  // =====================================================

  const sendPostToUser =
    async (
      user
    ) => {

      if (!user?._id) {

        toast.error(
          'Invalid user'
        )

        return
      }

      try {

        setSendingTo(
          user._id
        )

        const token =
          localStorage.getItem(
            'token'
          )

        if (!token) {

          toast.error(
            'Please login again'
          )

          return
        }

        const postImage =
          post.image_urls?.[0]?.url ||
          post.image_urls?.[0] ||
          ''

        const formData =
          new FormData()

        formData.append(
          'to_user_id',
          user._id
        )

        formData.append(
          'text',
          post.content || ''
        )

        formData.append(
          'message_type',
          'post'
        )

        formData.append(
          'media_url',
          postImage
        )

        const { data } =
          await api.post(
            '/api/message/send',
            formData,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          )

        if (
          !data.success
        ) {

          throw new Error(
            data.message ||
            'Failed to send post'
          )
        }

        toast.success(
          `Post sent to ${
            user.username ||
            user.full_name ||
            'user'
          }`
        )

        setShowShareModal(
          false
        )

      } catch (error) {

        toast.error(
          error.response
            ?.data
            ?.message ||
          error.message ||
          'Failed to send post'
        )

      } finally {

        setSendingTo(
          null
        )
      }
    }


  // =====================================================
  // DELETE POST
  // =====================================================

  const handleDelete =
    async () => {

      if (
        !window.confirm(
          'Delete this post? This cannot be undone.'
        )
      ) {
        return
      }

      try {

        const { data } =
          await api.delete(
            `/api/post/delete/${post._id}`
          )

        if (
          data.success
        ) {

          toast.success(
            'Post deleted'
          )

          onDeleted?.(
            post._id
          )

        } else {

          toast.error(
            data.message
          )
        }

      } catch (error) {

        toast.error(
          error.response
            ?.data
            ?.message ||
          error.message
        )
      }
    }


  // =====================================================
  // SHARE USERS
  // =====================================================

  const shareUsers =
    getShareUsers()


  // =====================================================
  // TOTAL MEDIA
  // =====================================================

  const totalImages =
    post.image_urls?.length ||
    0


  // =====================================================
  // SELECTED MEDIA
  // =====================================================

  const selectedImage =
    post.image_urls?.[
      currentImage
    ]


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <article className='bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl'>

        {/* =============================================
            POST HEADER
        ============================================== */}

        <div className='flex items-start justify-between'>

          <button
            type='button'
            onClick={
              openPostUserProfile
            }
            className='inline-flex items-center gap-3 text-left cursor-pointer'
          >

            {postProfilePicture ? (

              <img
                src={
                  postProfilePicture
                }
                alt={
                  postFullName
                }
                className='w-10 h-10 rounded-full shadow object-cover'
              />

            ) : (

              <div className='w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600'>

                {postFullName
                  .charAt(0)
                  .toUpperCase()}

              </div>
            )}

            <div>

              <div className='flex items-center gap-1'>

                <span className='font-semibold text-gray-900 hover:text-indigo-600 transition'>

                  {postFullName}

                </span>

                <BadgeCheck className='w-4 h-4 text-blue-500' />

              </div>

              <div className='text-gray-500 text-sm'>

                @{postUsername || 'user'}

                {' • '}

                {moment(
                  post.createdAt
                ).fromNow()}

              </div>

            </div>

          </button>


          {isOwner && (

            <button
              type='button'
              onClick={
                handleDelete
              }
              title='Delete post'
              className='p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50'
            >

              <Trash2 className='w-4 h-4' />

            </button>
          )}

        </div>


        {/* =============================================
            POST CONTENT
        ============================================== */}

        {post.content && (

          <div className='text-gray-800 text-sm whitespace-pre-line'>

            {post.content
              .split(
                /(#\w+)/g
              )
              .map(
                (
                  part,
                  index
                ) =>
                  /^#\w+$/.test(
                    part
                  ) ? (

                    <span
                      key={index}
                      className='text-indigo-600'
                    >
                      {part}
                    </span>

                  ) : (

                    part
                  )
              )}

          </div>
        )}


        {/* =============================================
            TIME CAPSULE
        ============================================== */}

        {post.publishAt &&
          new Date(
            post.publishAt
          ).getTime() >
          new Date(
            post.createdAt
          ).getTime() && (

            <div className='text-xs text-indigo-600 bg-indigo-50 rounded-md px-3 py-2'>

              Time Capsule • Published{' '}

              {moment(
                post.publishAt
              ).format(
                'DD MMM YYYY, hh:mm A'
              )}

            </div>
          )}


        {/* =============================================
            IMAGE / VIDEO CAROUSEL
        ============================================== */}

        {totalImages > 0 && (

          <div
            className='relative w-full overflow-hidden rounded-lg bg-black'
            onTouchStart={
              handleTouchStart
            }
            onTouchMove={
              handleTouchMove
            }
            onTouchEnd={
              handleTouchEnd
            }
          >

            <div
              className='flex transition-transform duration-300 ease-in-out'
              style={{
                transform:
                  `translateX(-${currentImage * 100}%)`
              }}
            >

              {post.image_urls.map(
                (
                  media,
                  index
                ) => {

                  const mediaUrl =
                    getMediaUrl(
                      media
                    )

                  if (!mediaUrl) {
                    return null
                  }

                  const isVideo =
                    isVideoMedia(
                      media
                    )

                  return (

                    <div
                      key={`${mediaUrl}-${index}`}
                      className='w-full min-w-full flex-shrink-0 bg-black flex items-center justify-center'
                    >

                      {isVideo ? (

                        <video
                          src={
                            mediaUrl
                          }
                          className='w-full max-h-[500px] object-contain bg-black'
                          controls
                          playsInline
                          preload='metadata'
                          onError={() => {
                            console.error(
                              'VIDEO LOAD ERROR:',
                              mediaUrl
                            )
                          }}
                        />

                      ) : (

                        <img
                          src={
                            mediaUrl
                          }
                          className='w-full max-h-[500px] object-contain bg-black'
                          alt={
                            typeof media ===
                            'object'
                              ? media?.caption ||
                                `Post image ${index + 1}`
                              : `Post image ${index + 1}`
                          }
                          onError={() => {
                            console.error(
                              'IMAGE LOAD ERROR:',
                              mediaUrl
                            )
                          }}
                        />

                      )}

                    </div>
                  )
                }
              )}

            </div>


            {totalImages > 1 && (

              <>

                <button
                  type='button'
                  onClick={
                    goToPreviousImage
                  }
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition'
                  aria-label='Previous media'
                >

                  <ChevronLeft className='w-5 h-5' />

                </button>


                <button
                  type='button'
                  onClick={
                    goToNextImage
                  }
                  className='absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition'
                  aria-label='Next media'
                >

                  <ChevronRight className='w-5 h-5' />

                </button>


                <div className='absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full'>

                  {currentImage + 1}
                  /
                  {totalImages}

                </div>


                <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5'>

                  {post.image_urls.map(
                    (
                      _,
                      index
                    ) => (

                      <button
                        key={index}
                        type='button'
                        onClick={() =>
                          setCurrentImage(
                            index
                          )
                        }
                        aria-label={
                          `Go to media ${index + 1}`
                        }
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          currentImage ===
                          index
                            ? 'bg-white w-2'
                            : 'bg-white/50'
                        }`}
                      />

                    )
                  )}

                </div>

              </>

            )}

          </div>
        )}


        {/* =============================================
            IMAGE / VIDEO CAPTION
        ============================================== */}

        {selectedImage &&
          typeof selectedImage ===
            'object' &&
          selectedImage.caption?.trim() && (

            <p className='text-sm text-gray-700 px-1 whitespace-pre-line'>

              {
                selectedImage.caption
              }

            </p>
          )}


        {/* =============================================
            REACTION SUMMARY
        ============================================== */}

        {totalReactions > 0 && (

          <div className='flex items-center gap-2 text-xs text-gray-500'>

            <div className='flex items-center'>

              {reactions
                .filter(
                  (
                    reaction
                  ) =>
                    reactionCounts[
                      reaction.type
                    ] > 0
                )
                .map(
                  (
                    reaction
                  ) => (

                    <span
                      key={
                        reaction.type
                      }
                      className='text-base -mr-1'
                      title={
                        `${reaction.label}: ${
                          reactionCounts[
                            reaction.type
                          ]
                        }`
                      }
                    >

                      {
                        reaction.emoji
                      }

                    </span>
                  )
                )}

            </div>

            <span>

              {totalReactions}{' '}

              {totalReactions === 1
                ? 'reaction'
                : 'reactions'}

            </span>

          </div>
        )}


        {/* =============================================
            ACTION BUTTONS
        ============================================== */}

        <div className='flex items-center gap-5 text-gray-600 text-sm pt-2 border-t border-gray-200'>


          {/* ==========================================
              REACTION BUTTON
          =========================================== */}

          <div className='relative'>

            <button
              type='button'
              onClick={() =>
                setShowReactionPicker(
                  (prev) =>
                    !prev
                )
              }
              className={`flex items-center gap-2 transition ${
                userReaction
                  ? 'text-indigo-600'
                  : 'hover:text-indigo-600'
              }`}
              title='React to post'
            >

              <span className='text-lg'>

                {currentReaction
                  ? currentReaction.emoji
                  : '❤️'}

              </span>

              <span>
                {totalReactions}
              </span>

            </button>


            {/* ========================================
                REACTION POPUP
            ========================================= */}

            {showReactionPicker && (

              <div className='absolute bottom-9 left-0 z-30 bg-white border border-gray-200 shadow-xl rounded-full px-3 py-2 flex items-center gap-2'>

                {reactions.map(
                  (
                    reaction
                  ) => (

                    <button
                      key={
                        reaction.type
                      }
                      type='button'
                      onClick={() =>
                        handleReaction(
                          reaction.type
                        )
                      }
                      title={
                        reaction.label
                      }
                      className={`text-2xl transition-transform hover:scale-125 ${
                        userReaction ===
                        reaction.type
                          ? 'scale-125'
                          : ''
                      }`}
                    >

                      {
                        reaction.emoji
                      }

                    </button>
                  )
                )}

              </div>
            )}

          </div>


          {/* ==========================================
              COMMENTS
          =========================================== */}

          <button
            type='button'
            onClick={
              loadComments
            }
            className='flex items-center gap-1 hover:text-indigo-600'
          >

            <MessageCircle className='w-4 h-4' />

            <span>

              {commentCount}{' '}

              {commentCount === 1
                ? 'Comment'
                : 'Comments'}

            </span>

          </button>


          {/* ==========================================
              SHARE
          =========================================== */}

          <button
            type='button'
            onClick={
              handleShare
            }
            className='flex items-center gap-1 hover:text-indigo-600'
          >

            <Share2 className='w-4 h-4' />

            <span>

              Share

              {post.share_count
                ? ` (${post.share_count})`
                : ''}

            </span>

          </button>

        </div>


        {/* =============================================
            COMMENTS SECTION
        ============================================== */}

        {showComments && (

          <div className='space-y-3 border-t border-gray-100 pt-3'>


            {/* COMMENT FORM */}

            <form
              onSubmit={
                handleComment
              }
              className='flex gap-2'
            >

              <div className='relative flex-1'>

                <input
                  value={
                    commentText
                  }
                  onChange={(e) =>
                    setCommentText(
                      e.target.value
                    )
                  }
                  placeholder='Write a comment…'
                  maxLength={500}
                  className='w-full border border-gray-200 rounded-full pl-4 pr-12 py-2 text-sm outline-none focus:border-indigo-400'
                />


                <button
                  type='button'
                  onClick={() =>
                    setShowEmojiPicker(
                      (prev) =>
                        !prev
                    )
                  }
                  className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600'
                  title='Add emoji'
                >

                  <Smile className='w-5 h-5' />

                </button>


                {showEmojiPicker && (

                  <div className='absolute right-0 bottom-12 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64'>

                    <div className='grid grid-cols-5 gap-2'>

                      {emojis.map(
                        (emoji) => (

                          <button
                            key={
                              emoji
                            }
                            type='button'
                            onClick={() =>
                              addEmoji(
                                emoji
                              )
                            }
                            className='text-xl p-1 rounded-lg hover:bg-gray-100'
                          >

                            {emoji}

                          </button>
                        )
                      )}

                    </div>

                  </div>
                )}

              </div>


              <button
                type='submit'
                className='p-2 rounded-full bg-indigo-600 text-white'
              >

                <Send className='w-4 h-4' />

              </button>

            </form>


            {/* COMMENTS LOADING */}

            {loadingComments ? (

              <p className='text-xs text-gray-400'>
                Loading comments…
              </p>


            ) : comments.length ? (


              comments.map(
                (
                  comment
                ) => {

                  const commentUserId =
                    String(
                      comment.user?._id ||
                      comment.user ||
                      ''
                    )

                  const isCommentOwner =
                    commentUserId ===
                    currentUserId

                  const commentName =
                    comment.user?.full_name ||
                    comment.user?.name ||
                    comment.user?.username ||
                    'User'

                  const commentUsername =
                    comment.user?.username ||
                    'user'


                  return (

                    <div
                      key={
                        comment._id
                      }
                      className='flex gap-2 items-start'
                    >

                      {comment.user?.profile_picture ? (

                        <img
                          src={
                            comment.user.profile_picture
                          }
                          alt={
                            commentName
                          }
                          className='w-7 h-7 rounded-full bg-gray-100 object-cover cursor-pointer'
                          onClick={() =>
                            commentUserId &&
                            navigate(
                              `/profile/${commentUserId}`
                            )
                          }
                        />

                      ) : (

                        <button
                          type='button'
                          onClick={() =>
                            commentUserId &&
                            navigate(
                              `/profile/${commentUserId}`
                            )
                          }
                          className='w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600'
                        >

                          {commentName
                            .charAt(0)
                            .toUpperCase()}

                        </button>
                      )}


                      <div className='bg-gray-50 rounded-lg px-3 py-2 flex-1'>

                        <div className='flex items-center justify-between gap-2'>


                          <button
                            type='button'
                            onClick={() =>
                              commentUserId &&
                              navigate(
                                `/profile/${commentUserId}`
                              )
                            }
                            className='text-left hover:text-indigo-600'
                          >

                            <div className='font-medium text-xs text-gray-900'>

                              {
                                commentName
                              }

                            </div>

                            <div className='text-[11px] text-gray-500'>

                              @
                              {
                                commentUsername
                              }

                            </div>

                          </button>


                          {isCommentOwner && (

                            <button
                              type='button'
                              onClick={() =>
                                handleDeleteComment(
                                  comment._id
                                )
                              }
                              title='Delete comment'
                              className='p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50'
                            >

                              <Trash2 className='w-3.5 h-3.5' />

                            </button>
                          )}

                        </div>


                        <p className='text-sm text-gray-700 whitespace-pre-line mt-1'>

                          {
                            comment.text
                          }

                        </p>

                      </div>

                    </div>
                  )
                }
              )


            ) : (

              <p className='text-xs text-gray-400'>

                No comments yet.
                Start the conversation.

              </p>
            )}

          </div>
        )}

      </article>


      {/* =================================================
          SHARE MODAL
      ================================================== */}

      {showShareModal && (

        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
          onClick={() =>
            setShowShareModal(
              false
            )
          }
        >

          <div
            className='bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden'
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* SHARE HEADER */}

            <div className='flex items-center justify-between px-5 py-4 border-b border-gray-200'>

              <div>

                <h2 className='text-lg font-semibold text-slate-800'>
                  Share this post
                </h2>

                <p className='text-xs text-gray-500 mt-1'>
                  Send this post to your friends
                </p>

              </div>


              <button
                type='button'
                onClick={() =>
                  setShowShareModal(
                    false
                  )
                }
                className='p-2 rounded-full hover:bg-gray-100 text-gray-500'
              >

                <X className='w-5 h-5' />

              </button>

            </div>


            {/* SHARE USERS */}

            <div className='max-h-96 overflow-y-auto p-3'>

              {shareUsers.length > 0 ? (

                shareUsers.map(
                  (
                    user
                  ) => {

                    const shareUserName =
                      user.full_name ||
                      user.name ||
                      user.username ||
                      'User'


                    return (

                      <div
                        key={
                          user._id
                        }
                        className='flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50'
                      >

                        <button
                          type='button'
                          onClick={() =>
                            navigate(
                              `/profile/${user._id}`
                            )
                          }
                          className='flex items-center gap-3 min-w-0'
                        >

                          {user.profile_picture ? (

                            <img
                              src={
                                user.profile_picture
                              }
                              alt={
                                shareUserName
                              }
                              className='w-11 h-11 rounded-full object-cover'
                            />

                          ) : (

                            <div className='w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold'>

                              {shareUserName
                                .charAt(0)
                                .toUpperCase()}

                            </div>
                          )}


                          <div className='text-left min-w-0'>

                            <p className='font-medium text-slate-800 truncate'>

                              {
                                shareUserName
                              }

                            </p>

                            <p className='text-xs text-gray-500 truncate'>

                              @
                              {
                                user.username ||
                                'user'
                              }

                            </p>

                          </div>

                        </button>


                        <button
                          type='button'
                          disabled={
                            sendingTo ===
                            user._id
                          }
                          onClick={() =>
                            sendPostToUser(
                              user
                            )
                          }
                          className='flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-full'
                        >

                          <Send className='w-4 h-4' />

                          {sendingTo ===
                          user._id
                            ? 'Sending...'
                            : 'Send'}

                        </button>

                      </div>
                    )
                  }
                )

              ) : (

                <div className='text-center py-10'>

                  <p className='text-gray-500 text-sm'>

                    No friends or followers found

                  </p>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </>
  )
}


export default PostCard