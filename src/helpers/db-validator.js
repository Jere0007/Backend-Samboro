import Role from '../role/role.model.js';
import User from '../users/user.model.js';
import { isValidObjectId } from 'mongoose';

export const esRoleValido = async(role = '') =>{
    const existeRol = await Role.findOne({ role });
    if (!existeRol) {
        throw new Error(`El rol ${role} no existe en la base de datos`);
    }
};

export const emailValido = async (email = '') => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;

    if (!regex.test(email)) {
        throw new Error(`El correo ${email} no tiene un formato válido`);
    }

    const existeEmail = await User.findOne({ email });
    if (existeEmail) {
        throw new Error(`El correo ${email} ya está registrado`);
    }
};

export const usernameExiste = async (username = '') => {
    const existeUsername = await User.findOne({ username });
    if (existeUsername) {
        throw new Error(`El username ${username} ya está registrado`);
    }
};

export const userDelete = async (id = '') => {
    const user = await User.findById(id);
    if (user.status === false) {
        throw new Error(`El usuario con id ${id} ya se ha eliminado`)
    }
}

// ✅ Validar si existe usuario por id o primer nombre exacto


export const getUserByParam = async (param = '') => {
    let foundUser = null;

    if (isValidObjectId(param)) {
        foundUser = await User.findById(param);
    } else {
        // Coincidencia exacta con el primer nombre (ignora mayúsculas)
        foundUser = await User.findOne({
            $or: [
                { username: { $regex: new RegExp(`^${param}\\b`, "i") } },
                { name: { $regex: new RegExp(`^${param}\\b`, "i") } },
                { surname: { $regex: new RegExp(`^${param}\\b`, "i") } }
            ]
        });
    }

    if (!foundUser) {
        throw new Error(`El usuario '${param}' no fue encontrado`);
    }

    return foundUser;
};
