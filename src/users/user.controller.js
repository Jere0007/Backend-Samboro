import { response, request } from "express";
import User from "./user.model.js";
import { isValidObjectId } from "mongoose";
import { hash, verify } from "argon2";

export const getUsers = async (req = request, res = response) => {
    try {
        const query = { status: true };

        const [total, users] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
        ])

        res.status(200).json({
            success: true,
            total,
            users
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Error al obtener los usuarios',
            error: error.message || error
        })
    }
};

export const getSearchUser = async (req, res) => {
    try {
        const { term } = req.query; // lo recibes como query param ?term=nombre/correo/id
        let users = [];

        if (!term) {
            return res.status(400).json({
                msg: "Debe proporcionar un término de búsqueda"
            });
        }

        // Si el término es un ObjectId válido, buscamos por ID
        if (isValidObjectId(term)) {
            const user = await User.findById(term);
            if (user) users.push(user);
        }

        // Buscar por nombre usando regex (ignora mayúsculas y minúsculas)
        const regex = new RegExp(term, "i");
        const usersByUsername = await User.find({
            $or: [
                { name: regex },
                { surname: regex },
                { username: regex }
            ],
            status: true
        });

        const userByEmail = await User.find({
            email: regex,
            status: true
        })

                // 👇 Búsqueda por nombre + apellido juntos
        const usersByFullName = await User.find({
        $or: [
            {
            $expr: {
                $regexMatch: {
                input: { $concat: ["$name", " ", "$surname"] }, // con espacio
                regex: regex
                }
            }
            },
            {
            $expr: {
                $regexMatch: {
                input: { $concat: ["$name", "$surname"] }, // sin espacio
                regex: regex
                }
            }
            }
        ],
        status: true
        });

        users = [...users, ...usersByUsername, ...userByEmail, ...usersByFullName];

        // Eliminar duplicados (en caso de que el ID también coincida con regex)
        const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());

        // Validación si no se encontró nada
        if (uniqueUsers.length === 0) {
            return res.status(404).json({
                success: false,
                msg: `No se encontró ningún usuario con el término: ${term}`
            });
        }

        res.json({
            success: true,
            results: uniqueUsers
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error en la búsqueda",
            error: error.message || error
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { _id, password, email, ...data } = req.body;
        const user = await User.findByIdAndUpdate(id, data, {new: true})

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "Usuario no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            msg: 'Usuario Actualizado',
            user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error al actualizar el usuario",
            error: error.message || error
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "Usuario no encontrado"
            });
        }

        const updatedUser = await User.findByIdAndUpdate(id, { status: false }, { new: true });

        res.status(200).json({
            success: true,
            msg: 'Usuario eliminado correctamente',
            user: updatedUser
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Hubo un error al eliminar el usuario',
            error: error.message || error
        })
    }
};

export const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { passwordOld, passwordNew } = req.body;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "Usuario no encontrado"
            });
        }

        // Verificamos que no estén vacíos
        if (!passwordOld || !passwordNew) {
            return res.status(400).json({
                success: false,
                msg: "Ambas contraseñas son obligatorias"
            });
        }

        // Verificar contraseña actual
        const isMatch = await verify(user.password, passwordOld);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                msg: "La contraseña actual no es correcta"
            });
        }

        // Hashear nueva contraseña
        const hashedPassword = await hash(passwordNew);
        user.password = hashedPassword;

        await user.save();

        res.json({
            success: true,
            msg: "Contraseña actualizada correctamente"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            msg: "Error al cambiar la contraseña",
            error: error.message || error
        });
    }
};

export const givePermission = async (req, res) => {
  try {
    const adminUser = req.usuario; // viene del JWT
    const userId = req.params.id;
    const { permission } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ 
        status: false,
        msg: "Usuario no encontrado" 
    });

    // 1️⃣ Developer puede dar/quitar cualquier permiso
    if (adminUser.role === "DEVELOPER_ROLE") {
      if (!user.permissions.includes(permission)) {
        user.permissions.push(permission);
      } else {
        user.permissions = user.permissions.filter(p => p !== permission);
      }
      await user.save();
      return res.status(200).json({
        success: true,
        msg: `Permiso '${permission}' actualizado para ${user.name} ${user.surname}`,
        permissions: user.permissions,
      });
    }

    // 2️⃣ Admin de área
    const adminAreaMap = {
      ADMIN_IT_ROLE: "IT_ROLE",
      ADMIN_MARKETING_ROLE: "MARKETING_ROLE",
      ADMIN_RRHH_ROLE: "RRHH_ROLE",
    };

    const allowedRole = adminAreaMap[adminUser.role];
    if (!allowedRole) {
      return res.status(403).json({ 
        success: false,
        msg: "No tienes permiso para otorgar permisos" 
    });
    }

    // Solo puede otorgar permisos a usuarios de su área
    if (user.role !== allowedRole) {
      return res.status(403).json({
        success: false,
        msg: `Solo puedes otorgar permisos a usuarios de tu área: ${allowedRole}`
      });
    }

    // 🔒 Aquí estaba el problema: 
    // Solo un ADMIN_xxx_ROLE que además tenga PERMISSION_ADMIN puede dar permisos
    if (!adminUser.permissions.includes("PERMISSION_ADMIN")) {
      return res.status(403).json({
        success: false,
        msg: "No tienes el permiso de administrador de área para otorgar permisos"
      });
    }

    // Lista de permisos pequeños que un admin de área puede gestionar
    const manageablePermissions = ["CREATE_PUBLICATION", "REGISTER_USER"];

    if (!manageablePermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        msg: `No puedes otorgar el permiso '${permission}'`
      });
    }

    // Agregar o quitar permiso
    if (!user.permissions.includes(permission)) {
      user.permissions.push(permission);
    } else {
      user.permissions = user.permissions.filter(p => p !== permission);
    }

    await user.save();
    return res.status(200).json({
      success: true,
      msg: `Permiso '${permission}' actualizado para ${user.name} ${user.surname}`,
      permissions: user.permissions,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Error al modificar permisos",
      error: error.message || error
    });
  }
};
