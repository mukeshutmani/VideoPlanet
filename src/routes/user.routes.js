import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";


const router = Router()

router.route("/register").post(registerUser)
 
// http://localhost:8000/users/regitser
export default router