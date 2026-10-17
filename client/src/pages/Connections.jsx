import React, { useEffect, useState } from 'react'
import {
  Users,
  UserPlus,
  UserCheck,
  UserRoundPen,
  MessageSquare
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchConnections } from '../features/connections/connectionsSlice'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Connections = () => {

  const [currentTab, setCurrentTab] =
    useState('Followers')

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const {
    connections = [],
    pendingConnections = [],
    followers = [],
    following = []
  } = useSelector(
    (state) => state.connections
  )

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = async () => {
    return localStorage.getItem('token')
  }

  // =====================================================
  // CHECK MONGODB OBJECT ID
  // =====================================================

  const isValidMongoId = (id) => {

    if (!id) {
      return false
    }

    return /^[0-9a-fA-F]{24}$/.test(
      String(id)
    )
  }

  // =====================================================
  // OPEN USER PROFILE
  // =====================================================

  const openUserProfile = (user) => {

    const mongoUserId =
      user?._id

    console.log(
      'OPENING USER PROFILE:',
      user
    )

    console.log(
      'PROFILE ID:',
      mongoUserId
    )

    // ---------------------------------------------------
    // PREVENT CLERK ID
    // ---------------------------------------------------

    if (
      !mongoUserId ||
      !isValidMongoId(mongoUserId)
    ) {

      console.error(
        'INVALID MONGODB USER ID:',
        mongoUserId
      )

      toast.error(
        'This user has an invalid profile ID. Please refresh your connections.'
      )

      return
    }

    navigate(
      `/profile/${mongoUserId}`
    )
  }

  // =====================================================
  // DATA ARRAY
  // =====================================================

  const dataArray = [
    {
      label: 'Followers',
      value: Array.isArray(followers)
        ? followers
        : [],
      icon: Users
    },

    {
      label: 'Following',
      value: Array.isArray(following)
        ? following
        : [],
      icon: UserCheck
    },

    {
      label: 'Pending',
      value: Array.isArray(
        pendingConnections
      )
        ? pendingConnections
        : [],
      icon: UserRoundPen
    },

    {
      label: 'Connections',
      value: Array.isArray(
        connections
      )
        ? connections
        : [],
      icon: UserPlus
    }
  ]

  // =====================================================
  // REFRESH CONNECTIONS
  // =====================================================

  const refreshConnections = async () => {

    try {

      const token =
        await getToken()

      if (!token) {

        toast.error(
          'Please login again'
        )

        return
      }

      dispatch(
        fetchConnections(token)
      )

    } catch (error) {

      console.error(
        'REFRESH CONNECTIONS ERROR:',
        error
      )

    }
  }

  // =====================================================
  // UNFOLLOW USER
  // =====================================================

  const handleUnfollow = async (
    userId
  ) => {

    try {

      const token =
        await getToken()

      if (!token) {

        toast.error(
          'Please login again'
        )

        return
      }

      if (
        !isValidMongoId(userId)
      ) {

        toast.error(
          'Invalid user ID'
        )

        console.error(
          'INVALID UNFOLLOW USER ID:',
          userId
        )

        return
      }

      const { data } =
        await api.post(
          '/api/user/unfollow',
          {
            userId
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        )

      if (data.success) {

        toast.success(
          data.message
        )

        dispatch(
          fetchConnections(token)
        )

      } else {

        toast.error(
          data.message ||
          'Failed to unfollow user'
        )
      }

    } catch (error) {

      console.error(
        'UNFOLLOW ERROR:',
        error
      )

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Failed to unfollow user'
      )
    }
  }

  // =====================================================
  // ACCEPT CONNECTION
  // =====================================================

  const acceptConnection =
    async (userId) => {

      try {

        const token =
          await getToken()

        if (!token) {

          toast.error(
            'Please login again'
          )

          return
        }

        if (
          !isValidMongoId(userId)
        ) {

          toast.error(
            'Invalid user ID'
          )

          console.error(
            'INVALID ACCEPT USER ID:',
            userId
          )

          return
        }

        const { data } =
          await api.post(
            '/api/user/accept',
            {
              userId
            },
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          )

        if (data.success) {

          toast.success(
            data.message
          )

          dispatch(
            fetchConnections(token)
          )

        } else {

          toast.error(
            data.message ||
            'Failed to accept connection'
          )
        }

      } catch (error) {

        console.error(
          'ACCEPT CONNECTION ERROR:',
          error
        )

        toast.error(
          error.response?.data?.message ||
          error.message ||
          'Failed to accept connection'
        )
      }
    }

  // =====================================================
  // FETCH CONNECTIONS
  // =====================================================

  useEffect(() => {

    refreshConnections()

  }, [])

  // =====================================================
  // CURRENT LIST
  // =====================================================

  const currentData =
    dataArray.find(
      (item) =>
        item.label === currentTab
    )?.value || []

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="min-h-screen bg-slate-50">

      <div className="max-w-6xl mx-auto p-6">

        {/* =====================================================
            TITLE
        ===================================================== */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Connections
          </h1>

          <p className="text-slate-600">
            Manage your network and discover new connections
          </p>

        </div>


        {/* =====================================================
            COUNTS
        ===================================================== */}

        <div className="mb-8 flex flex-wrap gap-6">

          {dataArray.map((item) => {

            const Icon = item.icon

            return (

              <div
                key={item.label}
                className="flex flex-col items-center justify-center gap-1 border h-24 w-40 border-gray-200 bg-white shadow rounded-md"
              >

                <div className="flex items-center gap-2">

                  <Icon className="w-4 h-4 text-indigo-500" />

                  <b className="text-xl text-slate-900">
                    {item.value.length}
                  </b>

                </div>

                <p className="text-slate-600">
                  {item.label}
                </p>

              </div>

            )
          })}

        </div>


        {/* =====================================================
            TABS
        ===================================================== */}

        <div className="inline-flex flex-wrap items-center border border-gray-200 rounded-md p-1 bg-white shadow-sm">

          {dataArray.map((tab) => {

            const Icon = tab.icon

            return (

              <button
                key={tab.label}
                type="button"
                onClick={() =>
                  setCurrentTab(
                    tab.label
                  )
                }
                className={`
                  cursor-pointer
                  flex
                  items-center
                  px-3
                  py-2
                  text-sm
                  rounded-md
                  transition-colors
                  ${
                    currentTab ===
                    tab.label
                      ? 'bg-indigo-50 font-medium text-indigo-600'
                      : 'text-gray-500 hover:text-black'
                  }
                `}
              >

                <Icon className="w-4 h-4" />

                <span className="ml-1">
                  {tab.label}
                </span>

                <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  {tab.value.length}
                </span>

              </button>

            )
          })}

        </div>


        {/* =====================================================
            USER LIST
        ===================================================== */}

        <div className="flex flex-wrap gap-6 mt-6">

          {currentData.length === 0 ? (

            <div className="w-full bg-white border border-gray-200 rounded-md shadow-sm p-10 text-center">

              <Users className="w-10 h-10 mx-auto text-gray-400 mb-3" />

              <p className="text-gray-500">

                {currentTab ===
                  'Followers' &&
                  'You have no followers yet.'}

                {currentTab ===
                  'Following' &&
                  'You are not following anyone yet.'}

                {currentTab ===
                  'Pending' &&
                  'You have no pending connection requests.'}

                {currentTab ===
                  'Connections' &&
                  'You have no connections yet.'}

              </p>

            </div>

          ) : (

            currentData.map(
              (user) => {

                const userId =
                  user?._id

                const validUserId =
                  isValidMongoId(
                    userId
                  )

                const displayName =
                  user?.full_name ||
                  user?.username ||
                  'User'

                const username =
                  user?.username ||
                  'user'

                return (

                  <div
                    key={
                      userId ||
                      Math.random()
                    }
                    className="w-full max-w-md flex gap-5 p-6 bg-white shadow rounded-md"
                  >

                    {/* =================================================
                        PROFILE IMAGE
                    ================================================= */}

                    <div className="flex-shrink-0">

                      {user?.profile_picture ? (

                        <img
                          src={
                            user.profile_picture
                          }
                          alt={
                            displayName
                          }
                          className="rounded-full w-12 h-12 shadow-md object-cover"
                        />

                      ) : (

                        <div className="rounded-full w-12 h-12 shadow-md bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-lg">

                          {displayName
                            .charAt(0)
                            .toUpperCase()}

                        </div>

                      )}

                    </div>


                    {/* =================================================
                        USER INFORMATION
                    ================================================= */}

                    <div className="flex-1 min-w-0">

                      <p className="font-medium text-slate-700 truncate">

                        {displayName}

                      </p>

                      <p className="text-slate-500 truncate">

                        @{username}

                      </p>

                      <p className="text-sm text-gray-600 mt-1">

                        {(user?.bio || '')
                          .slice(0, 30)}

                        {user?.bio &&
                        user.bio.length > 30
                          ? '...'
                          : ''}

                      </p>


                      {/* =================================================
                          BUTTONS
                      ================================================= */}

                      <div className="flex max-sm:flex-col gap-2 mt-4">

                        {/* VIEW PROFILE */}

                        <button
                          type="button"
                          disabled={
                            !validUserId
                          }
                          onClick={() =>
                            openUserProfile(
                              user
                            )
                          }
                          className={`w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white ${
                            !validUserId
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >

                          View Profile

                        </button>


                        {/* UNFOLLOW */}

                        {currentTab ===
                          'Following' && (

                          <button
                            type="button"
                            disabled={
                              !validUserId
                            }
                            onClick={() =>
                              handleUnfollow(
                                userId
                              )
                            }
                            className={`w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition ${
                              !validUserId
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer'
                            }`}
                          >

                            Unfollow

                          </button>

                        )}


                        {/* ACCEPT */}

                        {currentTab ===
                          'Pending' && (

                          <button
                            type="button"
                            disabled={
                              !validUserId
                            }
                            onClick={() =>
                              acceptConnection(
                                userId
                              )
                            }
                            className={`w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition ${
                              !validUserId
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer'
                            }`}
                          >

                            Accept

                          </button>

                        )}


                        {/* MESSAGE */}

                        {currentTab ===
                          'Connections' && (

                          <button
                            type="button"
                            disabled={
                              !validUserId
                            }
                            onClick={() => {

                              if (
                                !validUserId
                              ) {

                                toast.error(
                                  'Invalid user ID'
                                )

                                return
                              }

                              navigate(
                                `/messages/${userId}`
                              )

                            }}
                            className={`w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition flex items-center justify-center gap-1 ${
                              !validUserId
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer'
                            }`}
                          >

                            <MessageSquare className="w-4 h-4" />

                            Message

                          </button>

                        )}

                      </div>

                    </div>

                  </div>

                )
              }
            )

          )}

        </div>

      </div>

    </div>
  )
}

export default Connections