const validateAreaByRole = (req, res, next) => {
  const user = req.usuario; // viene del JWT

  // Si es admin, no hay restricción
  if (user.role === 'DEVELOPER_ROLE') return next();

  // Validación según rol
  const roleAreaMap = {
    IT_ROLE: "IT",
    ADMIN_IT_ROLE: "IT",
    MARKETING_ROLE: "MARKETING",
    ADMIN_MARKETING_ROLE: "MARKETING",
    RRHH_ROLE: "RRHH",
    ADMIN_RRHH_ROLE: "RRHH"
  };

  const allowedArea = roleAreaMap[user.role];

  if (!allowedArea) {
    return res.status(403).json({ msg: 'Rol no permitido para publicar' });
  }

  // Forzar el área en el body según el rol del usuario
  req.body.area = allowedArea;

  next();
};

export { validateAreaByRole };
