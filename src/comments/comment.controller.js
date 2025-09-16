import { response, request } from "express";
import Publication from "../publications/publication.model.js";
import Comment from "./comment.model.js";


export const getCommentsByPublication = async (req, res) => {
  try {
    const { publicationId } = req.params;

    const query = { publication: publicationId, status: true };

    const [total, comments] = await Promise.all([
      Comment.countDocuments(query),
      Comment.find(query)
        .populate("user", "name surname username email profilePhoto")
        .populate("likes", "name surname username email profilePhoto")
        .sort({ createdAt: -1 })
    ]);

    // Agregar el conteo de likes a cada comentario
    const commentsWithLikesCount = comments.map(comment => ({
      ...comment.toObject(),
      likesCount: comment.likes ? comment.likes.length : 0
    }));

    res.status(200).json({
      success: true,
      total,
      publiComments: commentsWithLikesCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error al obtener comentarios",
      error: error.message || error
    });
  }
};

export const addComment = async (req = request, res = response) => {
    try {
        const { text, publication } = req.body; // ahora usamos "publication" en vez de "id"
        const user = req.usuario;

        // Verificar que la publicación exista
        const pub = await Publication.findById(publication);
        if (!pub) {
            return res.status(404).json({
                success: false,
                msg: "No se encontró la publicación"
            });
        }

        // Crear el comentario
        const newComment = new Comment({
            text,
            publication: pub._id,
            user: user._id
        });

        await newComment.save();

        await Publication.findByIdAndUpdate(
            pub._id,
            { $push: { comments: newComment._id } }, // agrega al array
            { new: true } // opcional, devuelve la versión actualizada si la necesitas
        );

        // Poblar información del usuario
        const commentPopulated = await Comment.findById(newComment._id)
            .populate("user", "name surname username email profilePhoto")
            .populate("likes", "name surname username email profilePhoto");

        res.status(201).json({
            success: true,
            comment: commentPopulated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error al agregar el comentario",
            error: error.message || error
        });
    }
};

export const updateComment = async (req = request, res = response) => {
    try {
        const { id } = req.params; // id del comentario
        const { text } = req.body;
        const user = req.usuario;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({
                success: false,
                msg: "Comentario no encontrado"
            });
        }

        // Solo el autor puede editar
        if (comment.user.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                msg: "No tienes permisos para editar este comentario"
            });
        }

        // Actualizar el comentario
        comment.text = text?.trim() || comment.text;
        await comment.save();

        const commentPopulated = await Comment.findById(comment._id)
            .populate("user", "name surname username email");

        res.json({
            success: true,
            msg: "Comentario actualizado",
            comment: commentPopulated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error al actualizar comentario",
            error: error.message || error
        });
    }
};

export const deleteComment = async (req = request, res = response) => {
    try {
        const { id } = req.params; // id del comentario
        const user = req.usuario;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({
                success: false,
                msg: "Comentario no encontrado"
            });
        }

        // Solo autor o admin
        if (comment.user.toString() !== user._id.toString() && user.role !== "DEVELOPER_ROLE") {
            return res.status(403).json({
                success: false,
                msg: "No tienes permisos para eliminar este comentario"
            });
        }

        // Eliminación lógica
        comment.status = false;
        await comment.save();

        res.status(200).json({
            success: true,
            msg: "Comentario eliminado"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error al eliminar comentario",
            error: error.message || error
        });
    }
};

export const toggleLikeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.usuario.id; // 👈 id del usuario logueado

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                msg: "Comentario no encontrado"
            });
        }

        // Verificar si ya le dio like
        const alreadyLiked = comment.likes.includes(userId);

        if (alreadyLiked) {
            // Quitar like
            comment.likes = comment.likes.filter(
                id => id.toString() !== userId.toString()
            );
        } else {
            // Agregar like
            comment.likes.push(userId);
        }

        await comment.save();

        const commentPopulated = await Comment.findById(comment._id)
            .populate("likes", "name surname username email profilePhoto"); // solo campos que quieres

        return res.status(200).json({
            success: true,
            msg: alreadyLiked ? "Like eliminado" : "Like agregado",
            likesCount: commentPopulated.likes.length,
            likes: commentPopulated.likes
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: "Error al manejar el like del comentario",
            error: error.message || error
        });
    }
};
