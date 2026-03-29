import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useForm } from '../../hooks/useForm'
import { Input, Button, Alert } from '../../components/common'
import { AuthLayout } from '../../components/layout'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const { values, errors, loading, handleChange, handleSubmit, setErrors } = useForm(
    { voterId: '', password: '' },
    async (values) => {
      try {
        await login(values.voterId, values.password)
        navigate('/dashboard')
      } catch (error) {
        setErrors({
          submit: error.response?.data?.message || 'Login failed',
        })
      }
    }
  )

  return (
    <AuthLayout>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">EV</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">eVoteFace</h1>
          <p className="text-gray-600 mt-2">Voter Login</p>
        </div>

        {errors.submit && (
          <Alert type="error" message={errors.submit} className="mb-6" />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Voter ID"
            name="voterId"
            type="text"
            placeholder="Enter your voter ID"
            value={values.voterId}
            onChange={handleChange}
            error={errors.voterId}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-primary font-semibold hover:underline"
            >
              Register here
            </button>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Admin? <button
              onClick={() => navigate('/admin/login')}
              className="text-primary font-semibold hover:underline"
            >
              Admin Login
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
