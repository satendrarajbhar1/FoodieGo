import React, { useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../App';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false)

  const dispatch = useDispatch()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        {
          email: formData.email,
          password: formData.password
        },
        { withCredentials: true }
      );

      dispatch(setUserData(result.data))

    } catch (error) {
      setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Email nahi, Firebase ka ID token bhejo. Backend isse verify karega.
      const idToken = await result.user.getIdToken();

      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        { idToken },
        { withCredentials: true }
      );

      dispatch(setUserData(data))

    } catch (error) {
      setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        (error.code === 'auth/popup-closed-by-user'
          ? 'Google sign-in cancelled.'
          : 'Something went wrong. Please try again.')
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">

        <h1 className="mb-6 text-center text-3xl font-bold text-red-500">
          Tomato
        </h1>

        <h2 className="mb-2 text-center text-2xl font-semibold text-gray-800">
          Welcome Back
        </h2>

        <p className="mb-6 text-center text-sm text-gray-500">
          Sign in to your account
        </p>

        <form onSubmit={handleSignIn} className="space-y-4">

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 outline-none focus:border-red-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-red-500 hover:text-red-600"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-sm font-medium text-red-500 hover:text-red-600"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-500 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}

        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-300"></div>
          <span className="text-sm text-gray-500">OR</span>
          <div className="h-px flex-1 bg-gray-300"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              transform="translate(0 4)"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.72 6C44.4 37.99 46.98 31.9 46.98 24.55z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19z"
              transform="translate(0 4)"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.72-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              transform="translate(0 -4)"
            />
          </svg>

          Sign in with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a
            href="/signup"
            className="font-semibold text-red-500 hover:text-red-600"
          >
            Sign Up
          </a>
        </p>

      </div>
    </div>
  );
};

export default SignIn;