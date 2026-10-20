import jwt from "jsonwebtoken"

const isAuth = async (req, res, next) => {

    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({
                message: "Please sign in to continue"
            })
        }

        let decoded

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET)
        } catch {
            return res.status(401).json({
                message: "Session expired. Please sign in again."
            })
        }

        req.userId = decoded.userId
        next()
    } catch (error) {
        console.error("IS AUTH ERROR:", error)

        return res.status(500).json({
            message: "Authentication error"
        })
    }
}

export default isAuth