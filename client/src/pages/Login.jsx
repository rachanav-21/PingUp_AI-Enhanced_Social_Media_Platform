import React, { useState } from 'react'
import { assets } from '../assets/assets'
import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Login = () => {

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const { data } = await api.post('/api/auth/login', {
        username,
        password
      })

      if (data.success) {

        localStorage.setItem('token', data.token)

        toast.success('Login successful')

        window.location.href = '/'
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.message || 'Login failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex flex-col md:flex-row'>

      <img
        src={assets.bgImage}
        alt=''
        className='absolute top-0 left-0 -z-1 w-full h-full object-cover'
      />

      <div className='flex-1 flex flex-col items-start justify-between p-6 md:p-10 lg:pl-40'>

        <img
          src={assets.logo}
          alt=''
          className='h-12 object-contain'
        />

        <div>

          <div className='flex items-center gap-3 mb-4 max-md:mt-10'>

            <img
              src={assets.group_users}
              alt=''
              className='h-8 md:h-10'
            />

            <div>

              <div className='flex'>
                {Array(5).fill(0).map((_, i) => (
                  <Star
                    key={i}
                    className='size-4 md:size-4.5 text-transparent fill-amber-500'
                  />
                ))}
              </div>

              <p>Used by 12k+ developers</p>

            </div>

          </div>

          <h1 className='text-3xl md:text-6xl md:pb-2 font-bold bg-gradient-to-r from-indigo-950 to-indigo-800 bg-clip-text text-transparent'>
            More than just friends truly connect
          </h1>

          <p className='text-xl md:text-3xl text-indigo-900 max-w-72 md:max-w-md'>
            Sign in to join the PingUp community.
          </p>

        </div>

        <span className='md:h-10'></span>

      </div>

      <div className='flex-1 flex items-center justify-center p-6 sm:p-10'>

        <div className='bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl max-w-md w-full'>

          <h2 className='text-2xl font-bold text-center mb-6'>
            Login
          </h2>

          <form
            onSubmit={handleLogin}
            className='flex flex-col gap-4'
          >

            <input
              type='text'
              placeholder='Username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className='border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500'
            />

            <input
              type='password'
              placeholder='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500'
            />

            <button
              type='submit'
              disabled={loading}
              className='bg-indigo-600 text-white rounded-lg py-3 font-medium hover:bg-indigo-700 disabled:opacity-50'
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

          </form>

          <p className='text-center mt-5 text-sm text-gray-600'>
            Don't have an account?{' '}

            <Link
              to='/sign-up'
              className='text-indigo-600 font-medium'
            >
              Sign Up
            </Link>

          </p>

        </div>

      </div>

    </div>
  )
}

export default Login