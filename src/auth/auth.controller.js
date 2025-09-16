import User from '../users/user.model.js';
import { hash, verify } from 'argon2';
import { generarJWT } from '../helpers/generate-jwt.js';
import crypto from "crypto";
import { sendEmail } from '../utils/sendEmail.js';

export const login = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email && !username) {
            return res.status(400).json({
                success: false,
                msg: "Debes proporcionar email o username"
            });
        }

        const user = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                msg: "El email o username no existen en la base de datos"
            });
        }

        const validPassword = await verify(user.password, password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: 'La contraseña es incorrecta'
            });
        }

        const token = await generarJWT(user.id);

        res.status(200).json({
            success: true,
            msg: 'Inicio de sesión exitoso',
            userDetails: {
                user: [user._id, user.profilePhoto, user.name, user.surname, user.username, user.email, user.role, user.permissions],
                token: token
            }
        });

    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: 'server error',
            error: e.message
        });
    }
};

export const register = async (req, res) => {
  try {
    const data = req.body;
    const adminUser = req.usuario; // viene del JWT

    // 🔑 Mapeo de roles admin -> roles permitidos en su área
    const roleAreaMap = {
      ADMIN_IT_ROLE: ["IT_ROLE"],
      ADMIN_MARKETING_ROLE: ["MARKETING_ROLE"],
      ADMIN_RRHH_ROLE: ["RRHH_ROLE"],
    };

    // Si es admin de área, restringimos
    if (roleAreaMap[adminUser.role]) {
      const allowedRoles = roleAreaMap[adminUser.role];

      if (!allowedRoles.includes(data.role)) {
        return res.status(403).json({
          msg: `Solo puedes registrar usuarios de tu área (${allowedRoles.join(", ")})`,
        });
      }
    }

    // Encriptar contraseña
    const encryptedPassword = await hash(data.password);

    // Crear usuario
    const user = await User.create({
      name: data.name,
      surname: data.surname,
      username: data.username,
      email: data.email,
      password: encryptedPassword,
      role: data.role,
    });

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      userDetails: {
        user: [user.username, user.email, user.role],
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error en el registro de usuario",
      error: error.message,
    });
  }
};


// Paso 1: Solicitar reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
        return res.status(404).json({
            msg: "Usuario no encontrado"
        });

    // Generar token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();

    // En tu auth.controller.js
    const resetURL = `${process.env.BACKEND_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Recuperación de contraseña",
      `<p>Haz clic en el siguiente enlace para resetear tu contraseña:</p>
       <a href="${resetURL}">${resetURL}</a>`
    );

    res.status(200).json({
        success: true,
        msg: "Correo de recuperación enviado",
        resetLink: resetURL
    });
  } catch (error) {
    res.status(500).json({
        success: false,
        msg: "Error en solicitud de reset",
        error
    });
  }
};

// Paso 2: Resetear contraseña
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validación de longitud mínima
    if (!password || password.length < 6) {
      return res.status(400).json({
            success: false,
            msg: "La contraseña debe tener al menos 6 caracteres"
        });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) 
        return res.status(400).json({
            success: false,
            msg: "Token inválido o expirado"
    });

    // Encriptar nueva contraseña
    user.password = await hash(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        msg: "Contraseña actualizada correctamente"
    });
  } catch (error) {
    res.status(500).json({
        success: false,
        msg: "Error al resetear contraseña",
        error
    });
  }
};

// Paso 1b: Mostrar formulario de reset
export const showResetForm = async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) 
    return res.send("Token inválido o expirado");

  res.send(`
    <h2>Restablecer contraseña</h2>
    <form action="${process.env.BACKEND_URL}/reset-password/${token}" method="POST">
      <input type="password" name="password" placeholder="Nueva contraseña" required/>
      <button type="submit">Restablecer</button>
    </form>
  `);
};

