export const esDevRole = (req, res, next) => {
    if (!req.usuario) {
        return res.status(500).json({
            msg: 'Se quiere verificar el rol sin validar el token primero'
        });
    }

    const { role, username } = req.usuario;

    if (role !== 'DEVELOPER_ROLE') {
        return res.status(403).json({
            msg: `${username} no tiene permisos de administrador`
        });
    }

    next();
};

export const esDevRoleUpdate = (req, res, next) => {
    if (!req.usuario) {
        return res.status(500).json({
            success: false,
            msg: "Se quiere verificar el rol sin validar el token primero"
        });
    }

    const { role, _id, username } = req.usuario;
    const userIdToEdit = req.params.id; // ID del usuario que se quiere editar

    // Permitir si es admin o si el usuario quiere editar su propia info
    if (role !== "DEVELOPER_ROLE" && _id.toString() !== userIdToEdit) {
        return res.status(403).json({
            success: false,
            msg: `${username} no tienes permisos para editar este usuario`
        });
    }

    next();
};

export const esDevRoleDelete = (req, res, next) => {
    if (!req.usuario) {
        return res.status(500).json({
            success: false,
            msg: "Se quiere verificar el rol sin validar el token primero"
        });
    }

    const { role, username } = req.usuario;

    if (role !== "DEVELOPER_ROLE") {
        return res.status(403).json({
            success: false,
            msg: `${username} no tienes permisos para eliminar usuarios`
        });
    }

    next();
};

export const esDevRoleChangePassword = (req, res, next) => {
    if (!req.usuario) {
        return res.status(500).json({
            success: false,
            msg: "Se quiere verificar el rol sin validar el token primero"
        });
    }

    const { role, username } = req.usuario;

    if (role !== "DEVELOPER_ROLE") {
        return res.status(403).json({
            success: false,
            msg: `${username} no tienes permisos para cambiar contraseñas de usuarios`
        });
    }

    next();
};