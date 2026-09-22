import React, { useEffect, useState } from 'react'
import {
  assets,
  dummyPostsData
} from '../assets/assets'

import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import LikedPeopleBar from '../components/LikedPeopleBar'
import PostCard from '../components/PostCard'
import RecentMessages from '../components/RecentMessages'

import api from '../api/axios'

const Feed = () => {

  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(true)

  const getToken = async () =>
    localStorage.getItem('token')

  const fetchFeeds = async () => {
    try {
      setLoading(true)

      const token = await getToken()

      const { data } = await api.get(
        '/api/post/feed',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        setFeeds(data.posts)
      } else {
        setFeeds(dummyPostsData)
      }

    } catch (error) {
      console.error('Feed Error:', error)
      setFeeds(dummyPostsData)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchFeeds()
  }, [])

  return !loading ? (

    <div className='h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8'>

      {/* MAIN FEED */}

      <div className='w-full max-w-2xl'>

        <StoriesBar />

        <LikedPeopleBar />

        {/* POSTS */}

        <div className='p-4 space-y-6'>

          {feeds.map((post) => (

            <PostCard
              key={post._id}
              post={post}
              onDeleted={(id) =>
                setFeeds((prev) =>
                  prev.filter(
                    (item) => item._id !== id
                  )
                )
              }
            />

          ))}

        </div>

      </div>

      {/* RIGHT SIDEBAR */}

      <div className='max-xl:hidden sticky top-0'>

        <div className='max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow'>

          <h3 className='text-slate-800 font-semibold'>
            Sponsored
          </h3>

          {assets.sponsored_img && (

            <img
              src={assets.sponsored_img}
              className='w-75 h-50 rounded-md'
              alt=''
            />

          )}

          <p className='text-slate-600'>
            Email marketing
          </p>

          <p className='text-slate-400'>
            Supercharge your marketing with a powerful, easy-to-use platform built for results.
          </p>

        </div>

        <RecentMessages />

      </div>

    </div>

  ) : (

    <Loading />

  )
}

export default Feed