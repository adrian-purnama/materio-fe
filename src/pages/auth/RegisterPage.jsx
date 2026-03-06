import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiHelper from '../../helper/apiHelper'
import { useImage } from '../../context/ImageContext'

const RegisterPage = () => {
  const { logo } = useImage()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [registrationOpen, setRegistrationOpen] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkRegistration = async () => {
      const t = toast.loading('Checking registration...')
      try {
        const { data } = await apiHelper.get('/auth/check-registration')
        setRegistrationOpen(data.success === true)
      } catch {
        setRegistrationOpen(false)
      } finally {
        setLoading(false)
        toast.dismiss(t)
      }
    }
    checkRegistration()
  }, [])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Email is required')
      return
    }
    const t = toast.loading('Sending OTP...')
    try {
      const { data } = await apiHelper.post('/auth/send-otp', { email })
      toast.success(data.message || 'OTP sent', { id: t })
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP'
      toast.error(msg, { id: t })
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!email || !password || !otp) {
      toast.error('Full name, email, password and OTP are required')
      return
    }
    const t = toast.loading('Registering...')
    try {
      const { data } = await apiHelper.post('/auth/register', { name: name.trim(), email, password, otp })
      toast.success(data.message || 'Registered successfully', { id: t })
      setEmail('')
      setPassword('')
      setOtp('')

      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed'
      toast.error(msg, { id: t })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!registrationOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
          <p className="text-red-600 font-medium">Registration is disabled. Contact admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <div className='flex justify-between'>

        <h1 className="text-xl font-semibold mb-4 text-gray-900">Register</h1>
        <img src={logo} alt="Logo" className="w-20" />
        </div>

        <form onSubmit={handleRegister}>

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

          <div className="mb-4 flex gap-2">
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="OTP"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 whitespace-nowrap"
            >
              Send OTP
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
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
            Register
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-600 hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage