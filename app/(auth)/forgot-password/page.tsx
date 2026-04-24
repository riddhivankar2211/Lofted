'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="card w-full max-w-md p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h2>
        <p className="text-gray-600 mb-6">
          We sent a password reset link to <span className="font-medium">{email}</span>.
        </p>
        <Link href="/login" className="text-brand-600 text-sm font-semibold hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="card w-full max-w-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
      <p className="text-gray-500 text-sm mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="text-brand-600 font-semibold hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
