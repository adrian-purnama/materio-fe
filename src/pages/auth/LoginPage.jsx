import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiHelper from '../../helper/apiHelper'
import { useAuth } from '../../context/AuthContext'
import { useImage } from '../../context/ImageContext'

const LoginPage = () => {
  const { logo } = useImage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setEmail: setAuthEmail } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email and password are required')
      return
    }
    const t = toast.loading('Logging in...')
    try {
      const { data } = await apiHelper.post('/auth/login', { email, password })
      if (data?.data?.token) {
        localStorage.setItem('fc-token', data.data.token)
      }
      if (data?.data?.email) {
        setAuthEmail(data.data.email)
      }
      toast.success(data.message || 'Login successful', { id: t })
      setEmail('')
      setPassword('')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed'
      toast.error(msg, { id: t })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <div className='flex justify-between'>

        <h1 className="text-xl font-semibold mb-4 text-gray-900">Login</h1>
        <img src={logo} alt="Logo" className="w-20" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Email"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 text-gray-900 py-2 rounded font-medium hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-white"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-amber-600 hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
