import { body } from "express-validator";
import { validarCampos } from "./validar-campos.js";
import { esRoleValido, emailValido, usernameExiste } from "../helpers/db-validator.js";

export const registerValidator = [
    body('username', "The username is required").not().isEmpty(),
    body('username').custom(usernameExiste),

    body('email', 'The email is required').not().isEmpty(),
    body('email').custom(emailValido),

    body('role').custom(esRoleValido),

    body('password', 'Password must be at least 6 characteres').isLength({min: 6}),

    validarCampos
];

export const loginValidator = [
    body("email").optional().isEmail().withMessage("Enter a valid email address"),

    body("username").optional().isString().withMessage("Enter a valid username address"),
    
    body("password", "password must be at least 6 characters").isLength({min: 8}),
    
    validarCampos
]