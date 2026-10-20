import User from "../models/userModel.js"

export const getCurrentUser = async (req, res) => {

    try {
        const userId = req.userId

        if (!userId) {
            return res.status(400).json({
                message: "User id is not found"
            })
        }

        const user = await User.findById(userId).select(
            "-password -resetOtp -otpExpires -isOtpVerified"
        )

        if (!user) {
            return res.status(404).json({
                message: "user is not found"
            })
        }

        return res.status(200).json(user)
    } catch (error) {
        console.error("GET CURRENT USER ERROR:", error)

        return res.status(500).json({
            message: "Get current user error"
        })
    }
}