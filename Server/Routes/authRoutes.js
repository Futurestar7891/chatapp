import express from "express"
import { isAuthenticate } from "../Middleware/isAuthenticate.js";
import { checkAuth } from "../Controllers/authControllers.js";

const router=express.Router();

router.get("/check-auth",isAuthenticate,checkAuth);


export default router;