import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verfiyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(

    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
           name: "coverImage",
           maxCount: 1
        }
    ]),
    registerUser
)


router.route('/login').post(loginUser)

 // secure routes
 router.route("/logout").post(verfiyJWT ,logoutUser)

 router.route("/refresh-token").post(refreshAccessToken)


// http://localhost:8000/users/regitser
export default router