import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import PostCard from '../components/PostCard'
import api from '../api/axios'
import toast from 'react-hot-toast'

const SharedPost = () => {
  const { postId } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPost = async () => {
      try {
        const { data } = await api.get(`/api/post/view/${postId}`)
        if (data.success) setPost(data.post)
        else toast.error(data.message)
      } catch (error) {
        toast.error(error.response?.data?.message || error.message)
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [postId])

  if (loading) return <Loading />
  if (!post) return <div className='min-h-screen flex flex-col items-center justify-center gap-3'><p className='text-gray-600'>Post not found.</p><Link className='text-indigo-600' to='/'>Go to PingUp</Link></div>

  return (
    <div className='min-h-screen bg-gray-50 flex items-start justify-center p-6 pt-10'>
      <PostCard post={post} />
    </div>
  )
}

export default SharedPost
