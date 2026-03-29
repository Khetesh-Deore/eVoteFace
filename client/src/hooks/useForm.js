import { useState } from 'react'

export const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(values)
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'An error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    values,
    errors,
    loading,
    handleChange,
    handleSubmit,
    setErrors,
  }
}
