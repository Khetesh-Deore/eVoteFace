import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useForm } from '../../hooks/useForm'
import { Input, Button, Alert } from '../../components/common'
import { AuthLayout } from '../../components/layout'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const { values, errors, loading, handleChange, handleSubmit, setErrors } = useForm(
    { name: '', email: '', voterId: '', password: '', confirmPassword: '' },
    async (values) => {
      if (values.password !== values.confirmPassword) {
        setErrors({ confirmPassword: 'Passwords do not match' })
        return
      }

      try {
        await register(values.name, values.email, values.voterId, values.password)
        navigate('/verify')
      } catch (error) {
        setErrors({
          submit: error.response?.data?.message || 'Registration failed',
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
          <p className="text-gray-600 mt-2">Voter Registration</p>
        </div>

        {errors.submit && (
          <Alert type="error" message={errors.submit} className="mb-6" />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

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
            placeholder="Enter password (min 6 characters)"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            required
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary font-semibold hover:underline"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
