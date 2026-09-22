import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import UserCard from '../components/UserCard'
import Loading from '../components/Loading'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { fetchUser } from '../features/user/userSlice'

const Discover = () => {

  const dispatch = useDispatch()

  const [input, setInput] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const getToken = async () => {
    return localStorage.getItem('token')
  }

  // =====================================================
  // SEARCH USERS WHILE TYPING
  // =====================================================

  useEffect(() => {

    const searchUsers = async () => {

      const searchText = input.trim()

      // If search box is empty
      if (!searchText) {
        setUsers([])
        setLoading(false)
        return
      }

      try {

        setLoading(true)

        const token = await getToken()

        if (!token) {
          setUsers([])
          toast.error('Please login again')
          return
        }

        // IMPORTANT:
        // Your backend route is POST /api/user/discover
        const { data } = await api.post(
          '/api/user/discover',
          {
            input: searchText,
            search: searchText
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (data.success) {

          setUsers(
            Array.isArray(data.users)
              ? data.users
              : []
          )

        } else {

          setUsers([])

          if (data.message) {
            toast.error(data.message)
          }

        }

      } catch (error) {

        console.log('DISCOVER SEARCH ERROR:', error)

        setUsers([])

        toast.error(
          error.response?.data?.message ||
          error.message ||
          'Failed to search users'
        )

      } finally {

        setLoading(false)

      }

    }

    // Wait 300ms after typing
    const timer = setTimeout(() => {
      searchUsers()
    }, 300)

    return () => clearTimeout(timer)

  }, [input])


  // =====================================================
  // FETCH LOGGED-IN USER
  // =====================================================

  useEffect(() => {

    const loadUser = async () => {

      try {

        const token = await getToken()

        if (token) {
          dispatch(fetchUser(token))
        }

      } catch (error) {

        console.log('FETCH USER ERROR:', error)

      }

    }

    loadUser()

  }, [dispatch])


  // =====================================================
  // HANDLE SEARCH
  // =====================================================

  const handleSearch = (e) => {
    setInput(e.target.value)
  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      <div className="max-w-6xl mx-auto p-6">

        {/* ================================================= */}
        {/* TITLE */}
        {/* ================================================= */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Discover People
          </h1>

          <p className="text-slate-600">
            Connect with amazing people and grow your network
          </p>

        </div>


        {/* ================================================= */}
        {/* SEARCH BOX */}
        {/* ================================================= */}

        <div className="mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80">

          <div className="p-6">

            <div className="relative">

              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5"
              />

              <input
                type="text"
                value={input}
                onChange={handleSearch}
                placeholder="Search people by name or username..."
                className="pl-10 sm:pl-12 pr-4 py-3 w-full border border-gray-300 rounded-md max-sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {loading && (
          <Loading height="30vh" />
        )}


        {/* ================================================= */}
        {/* SEARCH RESULTS */}
        {/* ================================================= */}

        {!loading && users.length > 0 && (

          <div>

            <h2 className="text-xl font-semibold text-slate-900 mb-5">
              People
            </h2>

            <div className="flex flex-wrap gap-6">

              {users.map((user) => (

                <UserCard
                  key={user._id}
                  user={user}
                />

              ))}

            </div>

          </div>

        )}


        {/* ================================================= */}
        {/* NO RESULTS */}
        {/* ================================================= */}

        {!loading &&
          input.trim() &&
          users.length === 0 && (

            <div className="text-center py-16">

              <div className="flex justify-center mb-4">

                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">

                  <Search className="w-7 h-7 text-slate-400" />

                </div>

              </div>

              <h2 className="text-xl font-semibold text-slate-800">
                No people found
              </h2>

              <p className="text-slate-500 mt-2">
                Try searching with a different name or username.
              </p>

            </div>

          )}


        {/* ================================================= */}
        {/* INITIAL MESSAGE */}
        {/* ================================================= */}

        {!input.trim() && !loading && (

          <div className="text-center py-16">

            <div className="flex justify-center mb-4">

              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">

                <Search className="w-7 h-7 text-slate-400" />

              </div>

            </div>

            <h2 className="text-xl font-semibold text-slate-800">
              Search for people
            </h2>

            <p className="text-slate-500 mt-2">
              Start typing a name or username to discover people.
            </p>

          </div>

        )}

      </div>

    </div>

  )
}

export default Discover