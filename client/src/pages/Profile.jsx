import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import moment from 'moment'
import toast from 'react-hot-toast'

import {
  Brain,
  Sparkles,
  BarChart3,
  Smile,
  Hash,
  Lightbulb,
  Target,
  RefreshCw
} from 'lucide-react'

import Loading from '../components/Loading'
import UserProfileInfo from '../components/UserProfileInfo'
import PostCard from '../components/PostCard'
import ProfileModal from '../components/ProfileModal'
import api from '../api/axios'

const Profile = () => {

  // =====================================================
  // CURRENT USER
  // =====================================================

  const currentUser = useSelector(
    (state) => state.user.value
  )

  // =====================================================
  // URL PARAMETER
  // =====================================================

  const { profileId } = useParams()

  // =====================================================
  // STATES
  // =====================================================

  const [user, setUser] = useState(null)

  const [posts, setPosts] = useState([])

  const [activeTab, setActiveTab] = useState('posts')

  const [showEdit, setShowEdit] = useState(false)

  const [insights, setInsights] = useState(null)

  const [insightsLoading, setInsightsLoading] =
    useState(false)

  // =====================================================
  // GET JWT TOKEN
  // =====================================================

  const getToken = async () => {
    return localStorage.getItem('token')
  }

  // =====================================================
  // FETCH USER PROFILE
  // =====================================================

  const fetchUser = async (id) => {

    if (!id) {
      console.log(
        'PROFILE: No user ID provided'
      )
      return
    }

    try {

      const token = await getToken()

      if (!token) {

        toast.error(
          'Please login again'
        )

        return
      }

      console.log(
        'FETCHING PROFILE:',
        id
      )

      const { data } = await api.get(
        `/api/user/profile/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      console.log(
        'PROFILE RESPONSE:',
        data
      )

      if (data.success) {

        setUser(
          data.user ||
          data.profile ||
          null
        )

        setPosts(
          Array.isArray(data.posts)
            ? data.posts
            : []
        )

      } else {

        toast.error(
          data.message ||
          'Failed to load profile'
        )

        setUser(null)

        setPosts([])
      }

    } catch (error) {

      console.error(
        'FETCH PROFILE ERROR:',
        error
      )

      setUser(null)

      setPosts([])

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Failed to load profile'
      )
    }
  }

  // =====================================================
  // FETCH AI INSIGHTS
  // =====================================================

  const fetchAIInsights = async () => {

    if (insightsLoading) {
      return
    }

    setInsightsLoading(true)

    try {

      const token = await getToken()

      if (!token) {

        toast.error(
          'Please login again'
        )

        return
      }

      const { data } = await api.post(
        '/api/post/ai-insights',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      console.log(
        'AI INSIGHTS RESPONSE:',
        data
      )

      if (data.success) {

        setInsights(
          data.insights || null
        )

      } else {

        toast.error(
          data.message ||
          'Failed to generate AI insights'
        )
      }

    } catch (error) {

      console.error(
        'AI INSIGHTS ERROR:',
        error
      )

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Failed to generate AI insights'
      )

    } finally {

      setInsightsLoading(false)
    }
  }

  // =====================================================
  // LOAD PROFILE
  // =====================================================

  useEffect(() => {

    const id =
      profileId ||
      currentUser?._id

    if (id) {

      fetchUser(id)

    }

  }, [
    profileId,
    currentUser?._id
  ])

  // =====================================================
  // LOAD AI INSIGHTS
  // =====================================================

  useEffect(() => {

    if (
      activeTab === 'insights' &&
      !insights &&
      !insightsLoading
    ) {

      fetchAIInsights()

    }

  }, [
    activeTab,
    insights,
    insightsLoading
  ])

  // =====================================================
  // LOADING
  // =====================================================

  if (!user) {

    return <Loading />

  }

  // =====================================================
  // SAFE DATA
  // =====================================================

  const userCoverPhoto =
    typeof user.cover_photo === 'string' &&
    user.cover_photo.trim() !== ''
      ? user.cover_photo
      : null

  const mediaPosts =
    posts.filter(
      (post) =>
        Array.isArray(
          post.image_urls
        ) &&
        post.image_urls.some(
          (image) =>
            image &&
            typeof image.url === 'string' &&
            image.url.trim() !== ''
        )
    )

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className='relative h-full overflow-y-scroll bg-gray-50 p-6'>

      <div className='max-w-3xl mx-auto'>

        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <div className='bg-white rounded-2xl shadow overflow-hidden'>

          {/* =================================================
              COVER PHOTO
          ================================================= */}

          <div className='h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200'>

            {userCoverPhoto ? (

              <img
                src={userCoverPhoto}
                alt='Cover'
                className='w-full h-full object-cover'
                onError={(e) => {
                  e.currentTarget.style.display =
                    'none'
                }}
              />

            ) : null}

          </div>

          {/* =================================================
              USER INFO
          ================================================= */}

          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />

        </div>

        {/* =================================================
            TABS
        ================================================= */}

        <div className='mt-6'>

          <div className='bg-white rounded-xl shadow p-1 flex max-w-lg mx-auto'>

            {[
              {
                key: 'posts',
                label: 'Posts'
              },
              {
                key: 'media',
                label: 'Media'
              },
              {
                key: 'insights',
                label: 'AI Insights'
              }
            ].map((tab) => (

              <button
                key={tab.key}
                type='button'
                onClick={() =>
                  setActiveTab(tab.key)
                }
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >

                {tab.key === 'insights' && (

                  <Sparkles
                    className='w-4 h-4 inline mr-1'
                  />

                )}

                {tab.label}

              </button>

            ))}

          </div>

          {/* =================================================
              POSTS
          ================================================= */}

          {activeTab === 'posts' && (

            <div className='mt-6 flex flex-col items-center gap-6'>

              {posts.length > 0 ? (

                posts.map((post) => (

                  <PostCard
                    key={post._id}
                    post={post}
                    onDeleted={(id) => {

                      setPosts(
                        (prev) =>
                          prev.filter(
                            (item) =>
                              item._id !== id
                          )
                      )

                    }}
                  />

                ))

              ) : (

                <div className='bg-white rounded-xl shadow p-10 text-center w-full'>

                  <p className='text-gray-500'>
                    No posts yet.
                  </p>

                </div>

              )}

            </div>

          )}

          {/* =================================================
              MEDIA
          ================================================= */}

          {activeTab === 'media' && (

            <div className='flex flex-wrap mt-6 max-w-6xl'>

              {mediaPosts.length > 0 ? (

                mediaPosts.map((post) => (

                  <React.Fragment
                    key={post._id}
                  >

                    {Array.isArray(
                      post.image_urls
                    ) &&

                      post.image_urls.map(
                        (image, index) => {

                          const imageUrl =
                            typeof image?.url === 'string'
                              ? image.url.trim()
                              : ''

                          if (!imageUrl) {
                            return null
                          }

                          return (

                            <Link
                              target='_blank'
                              rel='noopener noreferrer'
                              to={imageUrl}
                              key={`${post._id}-${index}`}
                              className='relative group'
                            >

                              <img
                                src={imageUrl}
                                className='w-64 aspect-video object-cover'
                                alt={
                                  image?.caption ||
                                  'Post image'
                                }
                              />

                              <p className='absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300'>

                                Posted{' '}

                                {moment(
                                  post.createdAt
                                ).fromNow()}

                              </p>

                            </Link>

                          )
                        }
                      )}

                  </React.Fragment>

                ))

              ) : (

                <div className='bg-white rounded-xl shadow p-10 text-center w-full'>

                  <p className='text-gray-500'>
                    No media posts yet.
                  </p>

                </div>

              )}

            </div>

          )}

          {/* =================================================
              AI INSIGHTS
          ================================================= */}

          {activeTab === 'insights' && (

            <div className='mt-6'>

              {/* =================================================
                  LOADING
              ================================================= */}

              {insightsLoading ? (

                <div className='bg-white rounded-2xl shadow p-10 text-center'>

                  <div className='flex justify-center mb-4'>

                    <div className='w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center'>

                      <Brain className='w-7 h-7 text-indigo-600 animate-pulse' />

                    </div>

                  </div>

                  <h2 className='text-xl font-bold text-gray-900'>

                    PingUp AI is analyzing your profile

                  </h2>

                  <p className='text-gray-500 mt-2'>

                    Analyzing your recent posts and content style...

                  </p>

                  <div className='mt-5 flex justify-center'>

                    <div className='w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin' />

                  </div>

                </div>

              ) : insights ? (

                <div className='space-y-5'>

                  {/* =================================================
                      AI HEADER
                  ================================================= */}

                  <div className='bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow'>

                    <div className='flex items-center gap-3'>

                      <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center'>

                        <Brain className='w-7 h-7' />

                      </div>

                      <div>

                        <h2 className='text-2xl font-bold'>

                          AI Profile Insights

                        </h2>

                        <p className='text-white/80 text-sm mt-1'>

                          Personalized insights from your PingUp activity

                        </p>

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      ACTIVITY + CONTENT STYLE
                  ================================================= */}

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>

                    {/* ACTIVITY */}

                    <div className='bg-white rounded-2xl shadow p-5'>

                      <div className='flex items-center gap-3 mb-4'>

                        <div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center'>

                          <BarChart3 className='w-5 h-5 text-blue-600' />

                        </div>

                        <h3 className='font-semibold text-gray-900'>

                          Posting Activity

                        </h3>

                      </div>

                      <p className='text-gray-600 text-sm leading-6'>

                        {insights.activity ||
                          'Your posting activity is being analyzed.'}

                      </p>

                    </div>

                    {/* CONTENT STYLE */}

                    <div className='bg-white rounded-2xl shadow p-5'>

                      <div className='flex items-center gap-3 mb-4'>

                        <div className='w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center'>

                          <Target className='w-5 h-5 text-purple-600' />

                        </div>

                        <h3 className='font-semibold text-gray-900'>

                          Content Style

                        </h3>

                      </div>

                      <p className='text-gray-600 text-sm leading-6'>

                        {insights.contentStyle ||
                          'Your content style is being analyzed.'}

                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      MOOD
                  ================================================= */}

                  <div className='bg-white rounded-2xl shadow p-5'>

                    <div className='flex items-center gap-3 mb-4'>

                      <div className='w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center'>

                        <Smile className='w-5 h-5 text-yellow-600' />

                      </div>

                      <h3 className='font-semibold text-gray-900'>

                        Overall Content Mood

                      </h3>

                    </div>

                    <div className='bg-gray-50 rounded-xl p-4'>

                      <p className='text-gray-700'>

                        {insights.mood ||
                          'Your overall content mood is being analyzed.'}

                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      THEMES
                  ================================================= */}

                  <div className='bg-white rounded-2xl shadow p-5'>

                    <div className='flex items-center gap-3 mb-4'>

                      <div className='w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center'>

                        <Hash className='w-5 h-5 text-pink-600' />

                      </div>

                      <h3 className='font-semibold text-gray-900'>

                        Your Content Themes

                      </h3>

                    </div>

                    <div className='flex flex-wrap gap-3'>

                      {Array.isArray(
                        insights.themes
                      ) &&
                      insights.themes.length > 0 ? (

                        insights.themes.map(
                          (theme, index) => (

                            <span
                              key={index}
                              className='px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium'
                            >

                              #{theme}

                            </span>

                          )

                        )

                      ) : (

                        <p className='text-gray-500 text-sm'>

                          No specific themes detected yet.

                        </p>

                      )}

                    </div>

                  </div>

                  {/* =================================================
                      RECOMMENDATION
                  ================================================= */}

                  <div className='bg-white rounded-2xl shadow p-5'>

                    <div className='flex items-center gap-3 mb-4'>

                      <div className='w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center'>

                        <Lightbulb className='w-5 h-5 text-green-600' />

                      </div>

                      <h3 className='font-semibold text-gray-900'>

                        AI Recommendation

                      </h3>

                    </div>

                    <div className='bg-green-50 border border-green-100 rounded-xl p-4'>

                      <p className='text-gray-700 text-sm leading-6'>

                        {insights.recommendation ||
                          'Keep creating content and experiment with different formats.'}

                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      BEST CONTENT
                  ================================================= */}

                  <div className='bg-white rounded-2xl shadow p-5'>

                    <div className='flex items-center gap-3 mb-4'>

                      <div className='w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center'>

                        <Sparkles className='w-5 h-5 text-orange-600' />

                      </div>

                      <h3 className='font-semibold text-gray-900'>

                        Content You Should Try

                      </h3>

                    </div>

                    <p className='text-gray-600 text-sm leading-6'>

                      {insights.bestContent ||
                        'Experiment with different types of posts to discover what works best for you.'}

                    </p>

                  </div>

                  {/* =================================================
                      REFRESH
                  ================================================= */}

                  <div className='flex justify-center pt-2'>

                    <button
                      type='button'
                      onClick={fetchAIInsights}
                      disabled={insightsLoading}
                      className='flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition cursor-pointer disabled:opacity-50'
                    >

                      <RefreshCw
                        className={`w-4 h-4 ${
                          insightsLoading
                            ? 'animate-spin'
                            : ''
                        }`}
                      />

                      Refresh AI Insights

                    </button>

                  </div>

                  <p className='text-center text-xs text-gray-400 pb-4'>

                    AI insights are generated from your PingUp posts and are intended for entertainment and content guidance.

                  </p>

                </div>

              ) : (

                /* =================================================
                   NO INSIGHTS
                ================================================= */

                <div className='bg-white rounded-2xl shadow p-10 text-center'>

                  <div className='flex justify-center mb-4'>

                    <div className='w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center'>

                      <Brain className='w-7 h-7 text-indigo-600' />

                    </div>

                  </div>

                  <h2 className='text-xl font-bold text-gray-900'>

                    Discover Your AI Insights

                  </h2>

                  <p className='text-gray-500 mt-2'>

                    Let PingUp AI analyze your posts and discover your content style.

                  </p>

                  <button
                    type='button'
                    onClick={fetchAIInsights}
                    disabled={insightsLoading}
                    className='mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition cursor-pointer disabled:opacity-50'
                  >

                    Generate AI Insights

                  </button>

                </div>

              )}

            </div>

          )}

        </div>

      </div>

      {/* =====================================================
          EDIT PROFILE MODAL
      ===================================================== */}

      {showEdit && (

        <ProfileModal
          setShowEdit={setShowEdit}
        />

      )}

    </div>

  )
}

export default Profile