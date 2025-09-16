export const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    const user = req.usuario; // del JWT

    // Developer puede hacer todo
    if (user.role === "DEVELOPER_ROLE") {
      return next();
    }

    // Verifica si el usuario tiene al menos uno de los permisos requeridos
    const hasPermission = requiredPermissions.some(p => user.permissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        msg: "No tienes permisos para realizar esta acción"
      });
    }

    next();
  };
};
