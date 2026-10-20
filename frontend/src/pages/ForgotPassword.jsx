import React, { useState } from 'react';
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../App';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/send-otp`, { email });
      setStep(2);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/verify-otp`, {
        email,
        otp
      });
      setStep(3);
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP");
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await axios.post(`${serverUrl}/api/auth/reset-password`, {
        email,
        newPassword
      });
      navigate('/signin');
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/signin')}
            className="text-gray-600 hover:text-red-500"
          >
            <FaArrowLeftLong />
          </button>

          <h1 className="text-2xl font-bold text-gray-800">
            Forgot Password
          </h1>
        </div>

        {step === 1 && (
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Enter your email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full rounded-lg bg-red-500 py-3 font-semibold text-white hover:bg-red-600"
            >
              Send OTP
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <label htmlFor="otp" className="mb-2 block text-sm font-medium text-gray-700">
              OTP
            </label>
            <input
              id="otp"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="w-full rounded-lg bg-red-500 py-3 font-semibold text-white hover:bg-red-600"
            >
              Verify OTP
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700">
              Enter new password
            </label>
            <input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            />

            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            />

            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full rounded-lg bg-red-500 py-3 font-semibold text-white hover:bg-red-600"
            >
              Reset Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;