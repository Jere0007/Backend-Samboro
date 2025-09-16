import { Router } from "express";
import { getCommentsByPublication, addComment, deleteComment, toggleLikeComment, updateComment } from "./comment.controller.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { deleteFileOnError } from "../middlewares/deleteFileOnErros.js";

const router = Router();

router.get(
    "/getcommentsByPublication/:publicationId",
    deleteFileOnError,
    getCommentsByPublication
);

router.post(
    "/addComment",
    validarJWT,
    addComment
);

router.put(
    "/updateComment/:id",
    validarJWT,
    updateComment
)

router.delete(
    "/deleteComment/:id",
    validarJWT,
    deleteComment
)

router.put(
    "/like/:commentId",
    validarJWT,
    toggleLikeComment
)
export default router;