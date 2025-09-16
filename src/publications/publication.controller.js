import { response, request } from "express";
import  Publication from "./publication.model.js";
import Comment from "../comments/comment.model.js";
import User from "../users/user.model.js";
import { getUserByParam } from "../helpers/db-validator.js";

export const getPublications = async (req = request, res = response) => {
    try {
        const query = { status: true };

        const [total, publications] = await Promise.all([
            Publication.countDocuments(query),
            Publication.find(query)
                .populate("author", "username name surname email profilePhoto") // 👈 autor
                .populate({ 
                    path: "comments",
                    match: { status: true }, // solo comentarios activos
                    populate: { path: "user", select: "username name surname email profilePhoto" } // 👈 usuario del comentario
                })
                .populate({
                    path: "likes", // 👈 este es el array de ObjectId de usuarios
                    select: "username name surname email profilePhoto" // traemos los datos deseados
                })
                .sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            success: true,
            total,
            publications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Error al obtener las publicaciones',
            error: error.message || error
        });
    }
};

export const getPublicationsIT = async (req, res) => {
  try {
    const query = { status: true, area: "IT" };

    const [total, publications] = await Promise.all([
      Publication.countDocuments(query),
      Publication.find(query)
        .populate("author", "username name surname email profilePhoto")
        .populate({ 
          path: "comments",
          match: { status: true },
          populate: { path: "user", select: "username name surname email profilePhoto" }
        })
        .populate({
          path: "likes",
          select: "username name surname email profilePhoto"
        })
        .sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      total,
      publications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Error al obtener las publicaciones IT',
      error: error.message || error
    });
  }
};

export const getPublicationsMarketing = async (req, res) => {
  try {
    const query = { status: true, area: "MARKETING" };

    const [total, publications] = await Promise.all([
      Publication.countDocuments(query),
      Publication.find(query)
        .populate("author", "username name surname email profilePhoto")
        .populate({ 
          path: "comments",
          match: { status: true },
          populate: { path: "user", select: "username name surname email profilePhoto" }
        })
        .populate({
          path: "likes",
          select: "username name surname email profilePhoto"
        })
        .sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      total,
      publications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Error al obtener las publicaciones Marketing',
      error: error.message || error
    });
  }
};

export const getPublicationsRRHH = async (req, res) => {
  try {
    const query = { status: true, area: "RRHH" };

    const [total, publications] = await Promise.all([
      Publication.countDocuments(query),
      Publication.find(query)
        .populate("author", "username name surname email profilePhoto")
        .populate({ 
          path: "comments",
          match: { status: true },
          populate: { path: "user", select: "username name surname email profilePhoto" }
        })
        .populate({
          path: "likes",
          select: "username name surname email profilePhoto"
        })
        .sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      total,
      publications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Error al obtener las publicaciones RRHH',
      error: error.message || error
    });
  }
};

// Buscar publicaciones por ID o nombre de usuario
export const getPublicationsByUser = async (req = request, res = response) => {
    try {
        const { user } = req.params;

        const foundUser = await getUserByParam(user);

        // Buscar publicaciones del usuario
        const publications = await Publication.find({ author: foundUser._id, status: true })
            .populate("author", "username name surname email")
            .populate({
                path: "comments",
                populate: { path: "user", select: "username name surname email" }
            });

        if (publications.length === 0) {
            return res.status(200).json({
                success: true,
                msg: "El usuario no tiene publicaciones",
                total: 0,
                publications: []
            });
        }

        res.status(200).json({
            success: true,
            total: publications.length,
            publications
        });
    } catch (error) {
        console.error("Error en getPublicationsByUser:", error);
        res.status(500).json({
            success: false,
            msg: "Error al buscar publicaciones del usuario",
            error: error.message || error
        });
    }
};


// Agregar una publicación
export const addPublication = async (req, res) => {
    try {
        const { description, image, area } = req.body;
        const user = req.usuario; // viene del token

        if (!image) {
        return res.status(400).json({
            success: false,
            msg: "Debe proporcionar la imagen"
        });
        }

        if (!area) {
        return res.status(400).json({
            success: false,
            msg: "Debe proporcionar el área"
        });
        }

        // 🔑 Validar que el rol corresponda al área
        const roleAreaMap = {
            IT_ROLE: "IT",
            ADMIN_IT_ROLE: "IT",
            MARKETING_ROLE: "MARKETING",
            ADMIN_MARKETING_ROLE: "MARKETING",
            RRHH_ROLE: "RRHH",
            ADMIN_RRHH_ROLE: "RRHH",
        };

        if (user.role !== "DEVELOPER_ROLE") {
            const allowedArea = roleAreaMap[user.role];
        if (!allowedArea || allowedArea !== area) {
            return res.status(403).json({
                success: false,
                msg: `No puedes publicar en el área ${area}`
            });
        }
        }

        // Crear la publicación
        const publication = new Publication({
            description,
            image,
            area,
            author: user._id
        });

        await publication.save();

        // Poblar el autor
        const publicationPopulated = await Publication.findById(publication._id)
        .populate("author", "username name surname email");

        res.status(201).json({
            success: true,
            publication: publicationPopulated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error al agregar la publicación",
            error: error.message || error
        });
    }
};

export const updatePublication = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, image } = req.body;
        const user = req.usuario;

        // Verificar si la publicación existe
        const publication = await Publication.findById(id);
        if (!publication) {
            return res.status(404).json({
                success: false,
                msg: "Publicación no encontrada"
            });
        }

        if (!image) {
            return res.status(400).json({
                success: false,
                msg: "Debe proporcionar la imagen"
            });
        }

        // Validar autor
        if (publication.author.toString() !== user._id.toString() && user.role !== "DEVELOPER_ROLE") {
            return res.status(403).json({
                success: false,
                msg: "No tiene permisos para editar esta publicación"
            });
        }

        // Actualizar con findByIdAndUpdate
        const updatedPublication = await Publication.findByIdAndUpdate(
            id,
            {
                $set: {
                    description: description !== undefined ? description : publication.description,
                    image: image !== undefined ? image : publication.image
                }

            },
            { new: true } // Para que retorne la versión actualizada
        );

        res.json({
            success: true,
            msg: "Publicación actualizada",
            publication: updatedPublication
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error al actualizar publicación",
            error: error.message || error
        });
    }
};

export const deletePublication = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.usuario;

        // Verificar si la publicación existe
        const publication = await Publication.findById(id);
        if (!publication) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        // Solo autor o admin
        if (publication.author.toString() !== user._id.toString() && user.role !== "DEVELOPER_ROLE") {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta publicación'
            });
        }

        // Eliminación lógica de la publicación
        const updatedPublication = await Publication.findByIdAndUpdate(
            id,
            { status: false },
            { new: true }
        );

        // Eliminación lógica de los comentarios asociados
        await Comment.updateMany(
            { publication: id },
            { status: false }
        );

        res.status(200).json({
            success: true,
            message: 'Publicación y sus comentarios eliminados exitosamente',
            publication: updatedPublication
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la publicación',
            error: error.message || error
        });
    }
};

export const reactivatePublication = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.usuario;

        // Verificar si la publicación existe
        const publication = await Publication.findById(id);
        if (!publication) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        // Solo autor o admin
        if (publication.author.toString() !== user._id.toString() && user.role !== "DEVELOPER_ROLE") {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para reactivar esta publicación'
            });
        }

        // Reactivación lógica de la publicación
        const updatedPublication = await Publication.findByIdAndUpdate(
            id,
            { status: true },
            { new: true }
        );

        // Reactivación lógica de los comentarios asociados
        await Comment.updateMany(
            { publication: id },
            { status: true }
        );

        res.status(200).json({
            success: true,
            message: 'Publicación y sus comentarios reactivados exitosamente',
            publication: updatedPublication
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al reactivar la publicación',
            error: error.message || error
        });
    }
};

export const toggleLike = async (req, res) => {
    try {
        const { publicationId } = req.params;
        const userId = req.usuario.id;

        const publication = await Publication.findById(publicationId);
        if (!publication) {
            return res.status(404).json({
                success: false,
                msg: "Publicación no encontrada"
            });
        }

        const alreadyLiked = publication.likes.includes(userId);

        if (alreadyLiked) {
            publication.likes = publication.likes.filter(
                (id) => id.toString() !== userId.toString()
            );
        } else {
            publication.likes.push(userId);
        }

        await publication.save();

        const commentPopulated = await Publication.findById(publication._id)
            .populate("likes", "username name surname email profilePhoto");

        return res.status(200).json({
            success: true,
            msg: alreadyLiked ? "Like eliminado" : "Like agregado",
            likesCount: commentPopulated.likes.length,
            likes: commentPopulated.likes
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error al manejar el like",
            error: error.message || error
        });
    }
};