import React, { useState, useRef, useEffect } from 'react'

import {
  ArrowLeft,
  Brain,
  TrendingUp,
  Loader2,
  Sparkles,
  Bot,
  Send,
  User,
  Lightbulb,
  PenLine,
  BarChart3,
  WandSparkles,
  Trash2,
  X
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import api from '../api/axios'

const PingUpAI = () => {

  const navigate = useNavigate()

  const [loading, setLoading] = useState(null)

  const [personality, setPersonality] = useState(null)

  const [prediction, setPrediction] = useState(null)

  // =====================================================
  // AI CHAT STATES
  // =====================================================

  const [chatOpen, setChatOpen] = useState(false)

  const [message, setMessage] = useState('')

  const [chatLoading, setChatLoading] = useState(false)

  const [messages, setMessages] = useState([])

  const chatEndRef = useRef(null)

  const getToken = () =>
    localStorage.getItem('token')

  // =====================================================
  // AUTO SCROLL CHAT
  // =====================================================

  useEffect(() => {

    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({
        behavior: 'smooth'
      })
    }

  }, [messages, chatLoading])

  // =====================================================
  // PERSONALITY
  // =====================================================

  const handlePersonality = async () => {

    try {

      setLoading('personality')

      const token = getToken()

      const { data } = await api.post(
        '/api/post/ai-personality',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        setPersonality(data.personality)
      }

    } catch (error) {

      console.error(
        'AI Personality Error:',
        error
      )

      alert(
        error?.response?.data?.message ||
        'Unable to generate AI personality'
      )

    } finally {

      setLoading(null)

    }
  }

  // =====================================================
  // FUTURE PREDICTION
  // =====================================================

  const handlePrediction = async () => {

    try {

      setLoading('prediction')

      const token = getToken()

      const { data } = await api.post(
        '/api/post/ai-predict',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        setPrediction(data.prediction)
      }

    } catch (error) {

      console.error(
        'AI Prediction Error:',
        error
      )

      alert(
        error?.response?.data?.message ||
        'Unable to generate AI prediction'
      )

    } finally {

      setLoading(null)

    }
  }

  // =====================================================
  // OPEN CHAT
  // =====================================================

  const openChat = () => {

    setChatOpen(true)

    if (messages.length === 0) {

      setMessages([
        {
          role: 'assistant',
          content:
            "Hi! 👋 I'm your PingUp AI Companion. I can help you with post ideas, captions, profile growth, content analysis, your personality insights and future content predictions. What would you like to explore?"
        }
      ])

    }
  }

  // =====================================================
  // CLOSE CHAT
  // =====================================================

  const closeChat = () => {
    setChatOpen(false)
  }

  // =====================================================
  // CLEAR CHAT
  // =====================================================

  const clearChat = () => {

    setMessages([
      {
        role: 'assistant',
        content:
          "Fresh conversation started ✨ What would you like to know about your PingUp content?"
      }
    ])

  }

  // =====================================================
  // SEND CHAT MESSAGE
  // =====================================================

  const sendMessage = async (customMessage = null) => {

    const text =
      customMessage !== null
        ? customMessage
        : message.trim()

    if (!text || chatLoading) {
      return
    }

    const userMessage = {
      role: 'user',
      content: text
    }

    const updatedMessages = [
      ...messages,
      userMessage
    ]

    setMessages(updatedMessages)

    setMessage('')

    setChatLoading(true)

    try {

      const token = getToken()

      const history =
        updatedMessages
          .filter(
            item =>
              item.role === 'user' ||
              item.role === 'assistant'
          )
          .slice(-10)

      const { data } = await api.post(
        '/api/post/ai-chat',
        {
          message: text,
          history
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {

        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply
          }
        ])

      } else {

        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content:
              data.message ||
              'Something went wrong. Please try again.'
          }
        ])

      }

    } catch (error) {

      console.error(
        'AI Chat Error:',
        error
      )

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            error?.response?.data?.message ||
            'Unable to connect to PingUp AI. Please try again.'
        }
      ])

    } finally {

      setChatLoading(false)

    }
  }

  // =====================================================
  // QUICK PROMPTS
  // =====================================================

  const quickPrompts = [
    {
      icon: Lightbulb,
      label: 'Post Ideas',
      text:
        'Give me 5 creative post ideas based on my recent content.'
    },
    {
      icon: PenLine,
      label: 'Improve Post',
      text:
        'Give me tips to make my next post more engaging.'
    },
    {
      icon: BarChart3,
      label: 'Grow Profile',
      text:
        'How can I improve my PingUp profile and engagement?'
    },
    {
      icon: WandSparkles,
      label: 'Content Style',
      text:
        'Analyze my recent content style and tell me what I should try next.'
    }
  ]

  return (

    <div className='h-full overflow-y-scroll no-scrollbar py-8 px-4 md:px-8'>

      <div className='max-w-4xl mx-auto'>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className='flex items-center gap-3 mb-6'>

          <button
            onClick={() => navigate('/')}
            className='w-10 h-10 rounded-full bg-white border flex items-center justify-center hover:bg-slate-50 transition'
          >
            <ArrowLeft className='w-5 h-5 text-slate-700' />
          </button>

          <div>

            <div className='flex items-center gap-2'>

              <Sparkles className='w-5 h-5 text-indigo-600' />

              <h1 className='text-xl font-bold text-slate-800'>
                PingUp AI
              </h1>

            </div>

            <p className='text-xs text-slate-500 mt-1'>
              Understand yourself and discover your content future
            </p>

          </div>

        </div>

        {/* =====================================================
            AI FEATURES
        ===================================================== */}

        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>

          {/* =================================================
              PERSONALITY
          ================================================= */}

          <div className='rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-5 shadow-sm'>

            <div className='flex items-center justify-between mb-4'>

              <div className='w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow'>

                <Brain className='w-6 h-6 text-white' />

              </div>

              <span className='text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-600'>
                AI
              </span>

            </div>

            <h2 className='text-lg font-bold text-slate-800'>
              AI Personality
            </h2>

            <p className='text-sm text-slate-500 mt-2 leading-6'>
              Let PingUp AI analyze your posts, writing style,
              engagement and content patterns to understand your
              social media personality.
            </p>

            <button
              onClick={handlePersonality}
              disabled={loading !== null}
              className='w-full mt-5 rounded-xl bg-indigo-600 text-white py-3 text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2'
            >

              {loading === 'personality' ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className='w-4 h-4' />
                  Analyze My Personality
                </>
              )}

            </button>

          </div>

          {/* =================================================
              FUTURE PREDICTION
          ================================================= */}

          <div className='rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-5 shadow-sm'>

            <div className='flex items-center justify-between mb-4'>

              <div className='w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow'>

                <TrendingUp className='w-6 h-6 text-white' />

              </div>

              <span className='text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-600'>
                AI
              </span>

            </div>

            <h2 className='text-lg font-bold text-slate-800'>
              Future Prediction
            </h2>

            <p className='text-sm text-slate-500 mt-2 leading-6'>
              Predict your future content performance and discover
              which type of content may work better for you.
            </p>

            <button
              onClick={handlePrediction}
              disabled={loading !== null}
              className='w-full mt-5 rounded-xl bg-purple-600 text-white py-3 text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2'
            >

              {loading === 'prediction' ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Predicting...
                </>
              ) : (
                <>
                  <TrendingUp className='w-4 h-4' />
                  Predict My Future
                </>
              )}

            </button>

          </div>

        </div>

        {/* =====================================================
            🤖 AI CHAT CARD
        ===================================================== */}

        <div className='mt-5 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 shadow-sm'>

          <div className='flex items-start gap-4'>

            <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shrink-0'>

              <Bot className='w-7 h-7 text-white' />

            </div>

            <div className='flex-1'>

              <div className='flex items-center gap-2'>

                <h2 className='text-lg font-bold text-slate-800'>
                  PingUp AI Companion
                </h2>

                <span className='text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-600'>
                  AI
                </span>

              </div>

              <p className='text-sm text-slate-500 mt-2 leading-6'>
                Chat with an AI that understands your PingUp content.
                Ask for post ideas, improve your captions, analyze
                your content or discover new ways to grow.
              </p>

              <button
                onClick={openChat}
                className='mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition flex items-center gap-2'
              >
                <Bot className='w-4 h-4' />
                Chat with PingUp AI
              </button>

            </div>

          </div>

        </div>

        {/* =====================================================
            PERSONALITY RESULT
        ===================================================== */}

        {personality && (

          <div className='mt-6 rounded-2xl bg-white border border-indigo-100 shadow-sm overflow-hidden'>

            <div className='p-5 bg-gradient-to-r from-indigo-50 to-purple-50'>

              <p className='text-xs font-semibold text-indigo-600 uppercase'>
                Your Social Personality
              </p>

              <h2 className='text-2xl font-bold text-slate-800 mt-2'>
                {personality.title}
              </h2>

              <p className='text-sm text-slate-600 mt-2 leading-6'>
                {personality.summary}
              </p>

            </div>

            <div className='p-5 space-y-5'>

              <div>

                <h3 className='font-semibold text-slate-800 mb-3'>
                  Your Traits
                </h3>

                <div className='flex flex-wrap gap-2'>

                  {personality.traits?.map(
                    (trait, index) => (
                      <span
                        key={index}
                        className='px-3 py-2 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium'
                      >
                        ✨ {trait}
                      </span>
                    )
                  )}

                </div>

              </div>

              <div className='rounded-xl border p-4'>

                <p className='text-xs text-slate-400 uppercase font-semibold'>
                  Content Style
                </p>

                <p className='text-sm text-slate-700 mt-2 leading-6'>
                  {personality.contentStyle}
                </p>

              </div>

              <div className='rounded-xl bg-slate-50 p-4'>

                <p className='text-xs text-slate-400 uppercase font-semibold'>
                  AI Recommendation
                </p>

                <p className='text-sm text-slate-700 mt-2 leading-6'>
                  {personality.recommendation}
                </p>

              </div>

            </div>

          </div>

        )}

        {/* =====================================================
            PREDICTION RESULT
        ===================================================== */}

        {prediction && (

          <div className='mt-6 rounded-2xl bg-white border border-purple-100 shadow-sm overflow-hidden'>

            <div className='p-5 bg-gradient-to-r from-purple-50 to-indigo-50'>

              <p className='text-xs font-semibold text-purple-600 uppercase'>
                Future Content Score
              </p>

              <div className='flex items-center gap-5 mt-3'>

                <div className='text-4xl font-bold text-slate-800'>

                  {prediction.score}

                  <span className='text-lg'>
                    /100
                  </span>

                </div>

                <div>

                  <p className='font-semibold text-slate-800'>
                    {prediction.trend}
                  </p>

                  <p className='text-xs text-slate-500 mt-1'>
                    Based on your recent activity
                  </p>

                </div>

              </div>

              <div className='mt-5 h-2 rounded-full bg-white overflow-hidden'>

                <div
                  className='h-full bg-purple-600 rounded-full transition-all duration-700'
                  style={{
                    width: `${Math.min(
                      Math.max(
                        Number(
                          prediction.score
                        ) || 0,
                        0
                      ),
                      100
                    )}%`
                  }}
                />

              </div>

            </div>

            <div className='p-5 space-y-5'>

              <div className='rounded-xl border p-4'>

                <p className='text-xs text-slate-400 uppercase font-semibold'>
                  Best Content For You
                </p>

                <p className='text-sm text-slate-700 mt-2 leading-6'>
                  {prediction.bestContent}
                </p>

              </div>

              <div className='rounded-xl bg-slate-50 p-4'>

                <p className='text-xs text-slate-400 uppercase font-semibold'>
                  AI Prediction
                </p>

                <p className='text-sm text-slate-700 mt-2 leading-6'>
                  {prediction.prediction}
                </p>

              </div>

              <div>

                <h3 className='font-semibold text-slate-800 mb-3'>
                  What You Should Try
                </h3>

                <div className='space-y-2'>

                  {prediction.tips?.map(
                    (tip, index) => (
                      <div
                        key={index}
                        className='flex gap-3 items-start rounded-xl bg-purple-50 p-3'
                      >

                        <span className='w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0'>
                          {index + 1}
                        </span>

                        <p className='text-sm text-slate-700 leading-6'>
                          {tip}
                        </p>

                      </div>
                    )
                  )}

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

      {/* =====================================================
          🤖 CHAT MODAL
      ===================================================== */}

      {chatOpen && (

        <div className='fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4'>

          <div className='w-full max-w-2xl h-[85vh] md:h-[720px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col'>

            {/* CHAT HEADER */}

            <div className='px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between'>

              <div className='flex items-center gap-3'>

                <div className='w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center'>

                  <Bot className='w-6 h-6' />

                </div>

                <div>

                  <h2 className='font-bold'>
                    PingUp AI Companion
                  </h2>

                  <div className='flex items-center gap-1.5 mt-0.5'>

                    <span className='w-2 h-2 rounded-full bg-green-300' />

                    <span className='text-xs text-white/80'>
                      Ready to help
                    </span>

                  </div>

                </div>

              </div>

              <div className='flex items-center gap-2'>

                <button
                  onClick={clearChat}
                  title='Clear chat'
                  className='w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition'
                >
                  <Trash2 className='w-4 h-4' />
                </button>

                <button
                  onClick={closeChat}
                  className='w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition'
                >
                  <X className='w-5 h-5' />
                </button>

              </div>

            </div>

            {/* QUICK PROMPTS */}

            <div className='px-4 py-3 border-b bg-slate-50'>

              <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2'>
                Try asking
              </p>

              <div className='flex gap-2 overflow-x-auto no-scrollbar'>

                {quickPrompts.map(
                  (item, index) => {

                    const Icon = item.icon

                    return (
                      <button
                        key={index}
                        onClick={() =>
                          sendMessage(
                            item.text
                          )
                        }
                        disabled={chatLoading}
                        className='shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-600 transition disabled:opacity-50'
                      >

                        <Icon className='w-3.5 h-3.5' />

                        {item.label}

                      </button>
                    )
                  }
                )}

              </div>

            </div>

            {/* CHAT MESSAGES */}

            <div className='flex-1 overflow-y-auto p-4 md:p-5 space-y-4 bg-white'>

              {messages.map(
                (item, index) => (

                  <div
                    key={index}
                    className={`flex gap-3 ${
                      item.role === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >

                    {item.role === 'assistant' && (

                      <div className='w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-1'>

                        <Bot className='w-4 h-4' />

                      </div>

                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
                        item.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-md'
                          : 'bg-slate-100 text-slate-700 rounded-bl-md'
                      }`}
                    >
                      {item.content}
                    </div>

                    {item.role === 'user' && (

                      <div className='w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-1'>

                        <User className='w-4 h-4' />

                      </div>

                    )}

                  </div>

                )
              )}

              {chatLoading && (

                <div className='flex gap-3'>

                  <div className='w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0'>

                    <Bot className='w-4 h-4' />

                  </div>

                  <div className='bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2'>

                    <span className='w-2 h-2 bg-slate-400 rounded-full animate-bounce' />

                    <span className='w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]' />

                    <span className='w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]' />

                  </div>

                </div>

              )}

              <div ref={chatEndRef} />

            </div>

            {/* INPUT */}

            <div className='border-t bg-white p-3 md:p-4'>

              <form
                onSubmit={e => {
                  e.preventDefault()
                  sendMessage()
                }}
                className='flex items-end gap-2'
              >

                <textarea
                  value={message}
                  onChange={e =>
                    setMessage(
                      e.target.value
                    )
                  }
                  onKeyDown={e => {

                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey
                    ) {

                      e.preventDefault()

                      sendMessage()

                    }

                  }}
                  rows={1}
                  placeholder='Ask PingUp AI anything...'
                  disabled={chatLoading}
                  className='flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition disabled:bg-slate-50'
                />

                <button
                  type='submit'
                  disabled={
                    !message.trim() ||
                    chatLoading
                  }
                  className='w-11 h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 shrink-0'
                >

                  {chatLoading ? (
                    <Loader2 className='w-5 h-5 animate-spin' />
                  ) : (
                    <Send className='w-5 h-5' />
                  )}

                </button>

              </form>

              <p className='text-[10px] text-center text-slate-400 mt-2'>
                PingUp AI uses your recent content to personalize suggestions.
              </p>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default PingUpAI