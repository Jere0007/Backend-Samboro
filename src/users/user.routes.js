import { Router } from "express";
import { getUsers, getSearchUser, updateUser, deleteUser, changePassword, givePermission } from "./user.controller.js";
import { deleteFileOnError } from "../middlewares/deleteFileOnErros.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { check } from "express-validator";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { esDevRoleChangePassword, esDevRoleDelete, esDevRoleUpdate } from "../middlewares/validar-roles.js";
import { userDelete } from "../helpers/db-validator.js";

const router = Router();

router.get(
    "/listUsers",
    deleteFileOnError,
    getUsers
);

router.get(
    "/search",
    deleteFileOnError,
    getSearchUser
);

router.put(
    "/updateUser/:id",
    validarJWT,
    deleteFileOnError,
    esDevRoleUpdate,
    [
        check("id", "No es un id valido").isMongoId(),
        validarCampos
    ],
    updateUser
);

router.delete(
    "/deleteUser/:id",
    validarJWT,
    deleteFileOnError,
    esDevRoleDelete,
    [
        check("id", "No es un id valido").isMongoId(),
        check("id").custom(userDelete),
        validarCampos
    ],
    deleteUser
);

router.put(
    "/changePassword/:id",
    validarJWT,
    deleteFileOnError,
    esDevRoleChangePassword,
    [
        check("id", "No es un id valido").isMongoId(),
        validarCampos
    ],
    changePassword
);

router.patch("/permission/:id", validarJWT, givePermission);

export default router;