const jwt = require("jsonwebtoken")

const verifyAccessToken = ( req, res, next ) => {
    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access token is required",
        })
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET,
        )

        req.user = decoded

        next()
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Invalid or expired access token",
        })

    }
}

const requiredAdmin = (req, res, next) => {
    if(req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required",
        })
    }

    next()
}

const verifyRefreshToken = (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: "Refresh token is required",
        })
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET,
        )

        req.user = decoded
        req.refreshToken = refreshToken

        next()
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Invalid or expired refresh token",
        })
    }
}

module.exports = {
    verifyAccessToken,
    requiredAdmin,
    verifyRefreshToken,
}

