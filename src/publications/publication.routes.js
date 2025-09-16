import { Router } from "express";
import {
    getPublications,
    addPublication,
    getPublicationsByUser,
    toggleLike,
    updatePublication,
    deletePublication,
    reactivatePublication,
    getPublicationsIT,
    getPublicationsMarketing,
    getPublicationsRRHH
} from "./publication.controller.js";
import { deleteFileOnError } from "../middlewares/deleteFileOnErros.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { checkPermission } from "../middlewares/checkPermission.js";
import { checkOwner } from "../middlewares/checkOwner.js";
import { validateAreaByRole } from "../middlewares/validateAreaByRole .js";

const router = Router();

router.get(
    "/listPublications",
    deleteFileOnError,
    getPublications
);

router.get(
    "/ListPublications/it",
    deleteFileOnError,
    getPublicationsIT
);

router.get(
    "/ListPublications/marketing",
    deleteFileOnError,
    getPublicationsMarketing
);

router.get(
    "/ListPublications/rrhh",
    deleteFileOnError,
    getPublicationsRRHH
);

router.get(
    "/searchPostsByUser/:user",
    deleteFileOnError,
    getPublicationsByUser
);

router.post(
    "/addPublications",
    validarJWT,
    checkPermission("CREATE_PUBLICATION", "PERMISSION_ADMIN"),
    validateAreaByRole,
    addPublication
);

router.put(
    "/updatePublications/:id",
    validarJWT,
    checkOwner,
    updatePublication
)

router.delete(
    "/deletePublications/:id",
    validarJWT,
    checkOwner,
    deletePublication
)

router.put(
    "/reactivatedPublications/:id",
    validarJWT,
    checkOwner,
    reactivatePublication
)

router.put(
    "/like/:publicationId", 
    validarJWT,
    toggleLike
);

export default router;
