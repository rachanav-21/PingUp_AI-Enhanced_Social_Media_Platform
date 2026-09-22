import React, { useEffect, useState } from 'react'
import { Heart, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const LikedPeopleBar = ({ postId }) => {
  const [users, setUsers] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!postId) {
      setUsers([])
      return
    }

    const load = async () => {
      try {
        const { data } = await api.get('/api/post/liked-people', {
          params: {
            postId
          }
        })

        if (data.success) {
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Liked people:', error)
        setUsers([])
      }
    }

    load()
  }, [postId])

  if (!users.length) return null

  return (
    <section className='mx-4 mb-2 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3'>
      <div className='flex items-center gap-2 mb-3'>
        <Heart className='w-4 h-4 text-red-500 fill-red-500' />

        <div>
          <h3 className='text-sm font-semibold text-slate-800'>
            Your Reaction Trail
          </h3>

          <p className='text-[11px] text-slate-500'>
            People whose posts you've liked
          </p>
        </div>
      </div>

      <div className='flex gap-3 overflow-x-auto no-scrollbar'>
        {users.map((user) => (
          <button
            key={user._id}
            onClick={() => navigate(`/profile/${user._id}`)}
            className='min-w-20 flex flex-col items-center gap-1 group'
            title={`Open ${user.full_name || user.username || 'profile'}'s profile`}
          >
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt=''
                className='w-12 h-12 rounded-full object-cover ring-2 ring-white shadow'
              />
            ) : (
              <div className='w-12 h-12 rounded-full bg-white flex items-center justify-center ring-2 ring-white shadow text-indigo-600'>
                <UserRound className='w-5 h-5' />
              </div>
            )}

            <span className='text-[11px] font-medium text-slate-700 truncate max-w-20 group-hover:text-indigo-600'>
              {user.username
                ? `@${user.username}`
                : user.full_name || 'User'}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default LikedPeopleBar