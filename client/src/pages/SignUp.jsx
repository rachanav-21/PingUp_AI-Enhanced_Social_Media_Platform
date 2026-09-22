import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const SignUpPage = () => {

  const [full_name, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const { data } = await api.post('/api/auth/register', {
        full_name,
        username,
        email,
        password
      })

      if (data.success) {

        // Store JWT token
        localStorage.setItem('token', data.token)

        toast.success('Account created successfully')

        // Go to home page
        window.location.href = '/'

      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.error(error)

      toast.error(
        error.response?.data?.message || 'Registration failed'
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100 p-6'>

      <div className='bg-white rounded-2xl shadow-xl p-8 w-full max-w-md'>

        <h1 className='text-2xl font-bold text-center mb-2'>
          Create Account
        </h1>

        <p className='text-gray-500 text-center mb-6'>
          Join the PingUp community
        </p>

        <form
          onSubmit={handleRegister}
          className='flex flex-col gap-4'
        >

          <input
            type='text'
            placeholder='Full Name'
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            required
            className='border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500'
          />

          <input
            type='text'
            placeholder='Username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className='border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500'
          />

          <input
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500'
          />

          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className='border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500'
          />

          <button
            type='submit'
            disabled={loading}
            className='bg-indigo-600 text-white rounded-lg py-3 font-medium hover:bg-indigo-700 disabled:opacity-50'
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

        </form>

        <p className='text-center mt-5 text-sm text-gray-600'>
          Already have an account?{' '}

          <Link
            to='/'
            className='text-indigo-600 font-medium'
          >
            Login
          </Link>

        </p>

      </div>

    </div>
  )
}

export default SignUpPage