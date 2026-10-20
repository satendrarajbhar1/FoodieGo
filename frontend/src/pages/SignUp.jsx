import React, { useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../App';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

const SignUp = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch()

  const handleSignup = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        {
          fullName,
          email,
          password,
          mobile,
          role
        },
        {
          withCredentials: true
        }
      );

      // Login ho gaya, App apne aap redirect kar dega
      dispatch(setUserData(result.data))

    } catch (error) {
      setError(
        error.response?.data?.message || 'Signup failed. Please try again.'
      );
      console.log(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');

    if (!mobile.trim()) {
      setError('Mobile number is required for Google sign up.');
      return;
    }

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      // Email nahi, verified ID token bhejo
      const idToken = await result.user.getIdToken();

      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        {
          idToken,
          role,
          mobile: mobile.trim()
        },
        { withCredentials: true }
      )

      dispatch(setUserData(data))

    } catch (error) {
      setError(
        error.response?.data?.message ||
        (error.code === 'auth/popup-closed-by-user'
          ? 'Google sign-up cancelled.'
          : 'Google sign up failed. Please try again.')
      );
      console.log(error.response?.data || error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-md">

        <h1 className="mb-2 text-center text-2xl font-bold text-red-500">
          Tomato
        </h1>

        <h2 className="text-center text-xl font-semibold text-gray-800">
          Create Account
        </h2>

        <p className="mb-4 mt-1 text-center text-sm text-gray-500">
          Sign up to get started
        </p>

        <button
          type="button"
          onClick={handleGoogleSignup}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.05 13.22l7.98 6.19C12.92 13.72 18.03 9.5 24 9.5Z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.8 46.98 24.55Z"
            />
            <path
              fill="#FBBC05"
              d="M10.03 28.59A14.4 14.4 0 0 1 9.25 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.57 10.78l7.46-6.19Z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-5.97 0-11.08-4.22-12.97-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-1 text-center text-xs text-gray-400">
          Google ke liye pehle neeche mobile aur role bharo
        </p>

        <div className="my-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSignup} className="space-y-3">

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-16 text-sm outline-none focus:border-red-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-red-500"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <input
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500"
          />

          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
          >
            <option value="user">User</option>
            <option value="owner">Owner</option>
            <option value="deliveryBoy">Delivery Boy</option>
          </select>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a
            href="/signin"
            className="font-semibold text-red-500 hover:text-red-600"
          >
            Sign In
          </a>
        </p>

      </div>
    </div>
  );
};

export default SignUp;