import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useForm } from '../../hooks/useForm'
import { Input, Button, Alert } from '../../components/common'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const { values, errors, loading, handleChange, handleSubmit, setErrors } = useForm(
    { voterId: '', password: '' },
    async (formValues) => {
      try {
        setErrors({})
        
        // Validate fields
        if (!formValues.voterId.trim()) {
          setErrors({ voterId: 'Voter ID is required' })
          return
        }
        if (!formValues.password) {
          setErrors({ password: 'Password is required' })
          return
        }

        await login(formValues.voterId, formValues.password)
        navigate('/dashboard')
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.'
        setErrors({
          submit: errorMessage,
        })
      }
    }
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
              <span className="text-white font-bold text-3xl">🗳️</span>
            </div>
            <h1 className="text-3xl font-bold">eVoteFace</h1>
            <p className="text-white/90 mt-2 text-sm">Secure Voter Login</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Error Alert */}
            {errors.submit && (
              <Alert 
                type="error" 
                message={errors.submit} 
                className="mb-6"
              />
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Voter ID Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Voter ID
                </label>
                <div className="relative">
                  <Input
                    name="voterId"
                    type="text"
                    placeholder="Enter your voter ID"
                    value={values.voterId}
                    onChange={handleChange}
                    error={errors.voterId}
                    className="pl-10"
                    required
                  />
                  <span className="absolute left-3 top-3 text-gray-400">👤</span>
                </div>
                {errors.voterId && (
                  <p className="text-danger text-sm mt-1">{errors.voterId}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={values.password}
                    onChange={handleChange}
                    error={errors.password}
                    className="pl-10 pr-10"
                    required
                  />
                  <span className="absolute left-3 top-3 text-gray-400">🔒</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-danger text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-primary hover:text-primary/80 font-semibold transition"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    🔓 Login
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-primary font-bold hover:text-primary/80 transition"
                >
                  Register here
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Are you an administrator?{' '}
              <button
                onClick={() => navigate('/admin/login')}
                className="text-primary font-bold hover:text-primary/80 transition"
              >
                Admin Login
              </button>
            </p>
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
          <div className="flex gap-4">
            <span className="text-2xl">🔐</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure Login</h3>
              <p className="text-sm text-gray-600">
                Your credentials are encrypted and secure. Face verification will be required after login.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
