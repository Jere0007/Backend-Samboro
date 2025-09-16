import { Router } from "express";
import { login, register, requestPasswordReset, resetPassword, showResetForm } from "./auth.controller.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { esDevRole } from "../middlewares/validar-roles.js";
import { deleteFileOnError } from "../middlewares/deleteFileOnErros.js";
import { registerValidator } from "../middlewares/validator.js";
import { checkPermission } from "../middlewares/checkPermission.js";

const router = Router();

router.post(
    '/login',
    deleteFileOnError,
    login
);

router.post(
    '/register',
    validarJWT,
    deleteFileOnError,
    checkPermission("REGISTER_USER", "PERMISSION_ADMIN"),
    registerValidator,
    register
);

router.post(
    "/forgot-password",
    validarJWT,
    deleteFileOnError,
    esDevRole,
    requestPasswordReset
);

router.get(
    "/reset-password/:token",
    deleteFileOnError,
    showResetForm
);

router.post(
    "/reset-password/:token",
    deleteFileOnError,
    resetPassword
);

export default router;