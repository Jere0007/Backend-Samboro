import Publication from '../publications/publication.model.js';

const checkOwner = async (req, res, next) => {
  const user = req.usuario;
  const publicationId = req.params.id;

  try {
    const publication = await Publication.findById(publicationId);
    if (!publication) return res.status(404).json({ msg: 'Publicación no encontrada' });

    if (publication.author.toString() !== user.id && user.role !== 'DEVELOPER_ROLE') {
      return res.status(403).json({ msg: 'No tienes permisos sobre esta publicación' });
    }

    next();
  } catch (error) {
    res.status(500).json({ msg: 'Error verificando propietario', error: error.message || error  });
  }
}

export { checkOwner };