import crypto from "crypto";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";
import { verifyGoogleToken } from "../utils/verifyGoogleToken.js"

const ROLES = ["user", "owner", "deliveryBoy"];

const isProd = process.env.NODE_ENV === "production";

// Live par frontend aur backend alag domain par hote hain, isliye
// sameSite "none" aur secure true chahiye. Local me lax chalta hai.
const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

// Frontend ko kabhi password hash, OTP ya expiry nahi jaani chahiye
const toSafeUser = (user) => {
    const safe = user.toObject();
    delete safe.password;
    delete safe.resetOtp;
    delete safe.otpExpires;
    delete safe.isOtpVerified;
    return safe;
};

export const signUp = async (req, res) => {
    try {
        const { fullName, email, password, mobile, role } = req.body;

        if (!fullName || !email || !password || !mobile || !role) {
            return res.status(400).json({
                message: "Please fill all the fields"
            });
        }

        if (!ROLES.includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({
                message: "User already exist"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "password must be at least 6 characters"
            });
        }

        if (mobile.length < 10) {
            return res.status(400).json({
                message: "Mobile no. must be at least 10 digits"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        user = await User.create({
            fullName,
            email,
            role,
            mobile,
            password: hashedPassword
        });

        const token = await genToken(user._id);

        res.cookie("token", token, cookieOptions);

        return res.status(201).json(toSafeUser(user));

    } catch (error) {
        console.error("SIGNUP ERROR:", error);

        return res.status(500).json({
            message: "Sign up error"
        });
    }
};


export const signIn = async (req, res) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // password by default select nahi hota, isliye +password
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(400).json({
                message: "User doesn't exist"
            });
        }

        // Google se bana account, jisme password hai hi nahi
        if (!user.password) {
            return res.status(400).json({
                message: "This account uses Google sign-in. Please continue with Google."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }

        const token = await genToken(user._id);

        res.cookie("token", token, cookieOptions);

        return res.status(200).json(toSafeUser(user));

    } catch (error) {
        console.error("SIGNIN ERROR:", error);

        return res.status(500).json({
            message: "Sign in error"
        });
    }
};


export const signOut = async (req, res) => {

    try {
        // clearCookie me wahi options chahiye jo set karte waqt the
        const { maxAge, ...clearOptions } = cookieOptions;
        res.clearCookie("token", clearOptions);

        return res.status(200).json({
            message: "Logout successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Signout error"
        });
    }
};


export const sendOtp = async (req, res) => {

    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User doesn't exist."
            });
        }

        const otp = crypto.randomInt(1000, 10000).toString();

        user.resetOtp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000;
        user.isOtpVerified = false;
        await user.save();

        await sendOtpMail(email, otp);

        return res.status(200).json({
            message: "Otp sent successfully"
        });

    } catch (error) {
        console.error("SEND OTP ERROR:", error);

        return res.status(500).json({
            message: "Send otp error"
        });
    }
};


export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (
            !user ||
            !user.resetOtp ||
            user.resetOtp !== String(otp) ||
            user.otpExpires < Date.now()
        ) {
            return res.status(400).json({
                message: "Invalid or Expired Otp"
            });
        }

        user.isOtpVerified = true;
        user.resetOtp = undefined;
        user.otpExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "Otp verify successfully"
        });

    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);

        return res.status(500).json({
            message: "Verify otp error"
        });
    }
};


export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                message: "password must be at least 6 characters"
            });
        }

        const user = await User.findOne({ email });

        if (!user || !user.isOtpVerified) {
            return res.status(400).json({
                message: "Otp verification required"
            });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.isOtpVerified = false;

        await user.save();

        return res.status(200).json({
            message: "password reset successfully"
        });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);

        return res.status(500).json({
            message: "Reset password error"
        });
    }
};


export const googleAuth = async (req, res) => {

    try {
        const { idToken, mobile, role } = req.body;

        if (!idToken) {
            return res.status(400).json({
                message: "Google sign-in token is missing"
            });
        }

        // Token sach me Google/Firebase ne diya hai ya nahi, yahan verify hota hai
              let decoded;

        try {
            decoded = await verifyGoogleToken(idToken);
        } catch (verifyError) {
            console.error("GOOGLE TOKEN ERROR:", verifyError.message);

            return res.status(401).json({
                message: "Google sign-in could not be verified. Please try again."
            });
        }
        
        if (
            decoded.firebase?.sign_in_provider !== "google.com" ||
            !decoded.email ||
            !decoded.email_verified
        ) {
            return res.status(401).json({
                message: "Please use a verified Google account."
            });
        }

        // Email sirf verified token se aata hai, request body se kabhi nahi
        const email = decoded.email;

        let user = await User.findOne({ email });

        if (!user) {
            // Naya account: signup page se mobile aur role aate hain
            if (!mobile || !ROLES.includes(role)) {
                return res.status(404).json({
                    message: "No account found. Please sign up first."
                });
            }

            user = await User.create({
                fullName: decoded.name || email.split("@")[0],
                email,
                mobile,
                role
            });
        }

        const token = await genToken(user._id);

        res.cookie("token", token, cookieOptions);

        return res.status(200).json(toSafeUser(user));

    } catch (error) {
        console.error("GOOGLE AUTH ERROR:", error);

        return res.status(500).json({
            message: "Google auth error"
        });
    }
};