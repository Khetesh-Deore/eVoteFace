import { useNavigate } from 'react-router-dom'
import { useForm } from '../../hooks/useForm'
import { Input, Button, Alert } from '../../components/common'
import { AuthLayout } from '../../components/layout'
import { authService } from '../../services/authService'

export const AdminLoginPage = () => {
  const navigate = useNavigate()

  const { values, errors, loading, handleChange, handleSubmit, setErrors } = useForm(
    { username: '', password: '' },
    async (values) => {
      try {
        const response = await authService.adminLogin(values.username, values.password)
        localStorage.setItem('token', response.data.token)
        navigate('/admin')
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
          <p className="text-gray-600 mt-2">Admin Login</p>
        </div>

        {errors.submit && (
          <Alert type="error" message={errors.submit} className="mb-6" />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            name="username"
            type="text"
            placeholder="Enter admin username"
            value={values.username}
            onChange={handleChange}
            error={errors.username}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter admin password"
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
            {loading ? 'Logging in...' : 'Admin Login'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Voter? <button
              onClick={() => navigate('/login')}
              className="text-primary font-semibold hover:underline"
            >
              Voter Login
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
