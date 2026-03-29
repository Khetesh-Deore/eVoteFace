import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '../../hooks/useForm'
import { Input, Button, Alert } from '../../components/common'
import { authService } from '../../services/authService'

export const AdminLoginPage = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const { values, errors, loading, handleChange, handleSubmit, setErrors } = useForm(
    { username: '', password: '' },
    async (formValues) => {
      try {
        setErrors({})

        if (!formValues.username.trim()) {
          setErrors({ username: 'Username is required' })
          return
        }
        if (!formValues.password) {
          setErrors({ password: 'Password is required' })
          return
        }

        const response = await authService.adminLogin(formValues.username, formValues.password)
        localStorage.setItem('token', response.data.token)
        navigate('/admin')
      } catch (error) {
        setErrors({
          submit: error.response?.data?.message || 'Admin login failed',
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
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
              <span className="text-white font-bold text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold">eVoteFace</h1>
            <p className="text-white/90 mt-2 text-sm">Admin Portal</p>
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
              {/* Username Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Username
                </label>
                <div className="relative">
                  <Input
                    name="username"
                    type="text"
                    placeholder="Enter admin username"
                    value={values.username}
                    onChange={handleChange}
                    error={errors.username}
                    className="pl-10"
                    required
                  />
                  <span className="absolute left-3 top-3 text-gray-400">👤</span>
                </div>
                {errors.username && (
                  <p className="text-danger text-sm mt-1">{errors.username}</p>
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
                    placeholder="Enter admin password"
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    🔓 Admin Login
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

            {/* Voter Link */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Are you a voter?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-primary font-bold hover:text-primary/80 transition"
                >
                  Voter Login
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Need help? Contact system administrator
            </p>
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-900">
          <div className="flex gap-4">
            <span className="text-2xl">🔐</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure Admin Access</h3>
              <p className="text-sm text-gray-600">
                Admin credentials are encrypted. Only authorized administrators can access the election management panel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
