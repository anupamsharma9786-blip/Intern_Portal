import { Router } from "express";
import { loginValidator, registerValidator } from "../validators/auth.validator.js";
import { register, login, getMe } from "../controllers/auth.controller.js";
import verifyAuth from "../middlewares/verifyAuth.js";

const authRouter = Router()

// POST api/auth/register
// Request body:
// {
//   "email": "user@example.com",
//   "password": "password123",
//   "role": "intern",       // optional
//   "internCode": "ABC123"   // optional
// }
// Validation: registerValidator
// Handler: register
authRouter.post("/register", registerValidator, register)

// POST api/auth/login
// Request body:
// {
//   "email": "user@example.com",
//   "password": "password123",
//   "internCode": "ABC123"   // optional in current controller lookup
// }
// Validation: loginValidator
// Handler: login
authRouter.post("/login", loginValidator, login)

authRouter.get("/get-me", verifyAuth, getMe)

export default authRouter