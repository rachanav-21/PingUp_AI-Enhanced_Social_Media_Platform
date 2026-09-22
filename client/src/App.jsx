import React, { useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import SignUpPage from './pages/SignUp'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import ChatBox from './pages/ChatBox'
import Connections from './pages/Connections'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
import SharedPost from './pages/SharedPost'
import Layout from './pages/Layout'
import PingUpAI from './pages/PingUpAI'
import toast, { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchUser } from './features/user/userSlice'
import { fetchConnections } from './features/connections/connectionsSlice'
import { addMessage } from './features/messages/messagesSlice'
import Notification from './components/Notification'

const App = () => {
  const { pathname } = useLocation()
  const pathnameRef = useRef(pathname)

  const dispatch = useDispatch()

  const token = localStorage.getItem('token')
  const shouldShowApp = !!token

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      dispatch(fetchUser(token))
      dispatch(fetchConnections(token))
    }
  }, [dispatch])

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      return
    }

    let userId

    try {
      const payload = token.split('.')[1]
      const normalized = payload
        .replace(/-/g, '+')
        .replace(/_/g, '/')

      const decodedToken = JSON.parse(atob(normalized))
      userId = decodedToken.userId
    } catch (error) {
      console.error('Invalid session token')
      localStorage.removeItem('token')
      window.location.href = '/'
      return
    }

    if (!userId) {
      return
    }

    const eventSource = new EventSource(
      import.meta.env.VITE_BASEURL + '/api/message/' + userId
    )

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (
        pathnameRef.current ===
        '/messages/' + message.from_user_id._id
      ) {
        dispatch(addMessage(message))
      } else {
        toast.custom(
          (t) => (
            <Notification
              t={t}
              message={message}
            />
          ),
          {
            position: 'bottom-right'
          }
        )
      }
    }

    return () => {
      eventSource.close()
    }
  }, [dispatch])

  return (
    <>
      <Toaster />

      <Routes>
        <Route
          path='/sign-up/*'
          element={<SignUpPage />}
        />

        <Route
          path='/post/:postId'
          element={shouldShowApp ? <SharedPost /> : <Login />}
        />

        <Route
          path='/'
          element={shouldShowApp ? <Layout /> : <Login />}
        >
          <Route
            index
            element={<Feed />}
          />

          <Route
            path='messages'
            element={<Messages />}
          />

          <Route
            path='messages/:userId'
            element={<ChatBox />}
          />

          <Route
            path='connections'
            element={<Connections />}
          />

          <Route
            path='discover'
            element={<Discover />}
          />

          <Route
            path='profile'
            element={<Profile />}
          />

          <Route
            path='profile/:profileId'
            element={<Profile />}
          />

          <Route
            path='create-post'
            element={<CreatePost />}
          />

          <Route
            path='ai'
            element={<PingUpAI />}
          />
        </Route>
      </Routes>
    </>
  )
}

export default App