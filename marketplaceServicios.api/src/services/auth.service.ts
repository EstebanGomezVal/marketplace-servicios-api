import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import usuarioModel from '../models/Usuario.model';
import { sendVerificationEmail } from './account.service';

const SALT_ROUNDS = 10;
export const INVALID_CREDENTIALS_ERROR = 'Correo o contraseña incorrectos';

export interface RegisterUserData {
    nombre: string;
    apellido: string;
    correo: string;
    password: string;
    telefono?: string;
    ciudad?: string;
}

export interface LoginUserData {
    correo: string;
    password: string;
}

export const register = async (userData: RegisterUserData) => {
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const nuevoUsuario = await usuarioModel.create({
        ...userData,
        password: hashedPassword,
        emailVerified: false
    });

    // No bloquea ni falla el registro si el correo no sale (solo log warn)
    await sendVerificationEmail(nuevoUsuario);

    return nuevoUsuario;
};

export const login = async ({ correo, password }: LoginUserData) => {
    const usuario = await usuarioModel.findOne({ correo }).select('+password');

    if (!usuario || usuario.isDeleted) {
        throw new Error(INVALID_CREDENTIALS_ERROR);
    }

    if (!usuario.password) {
        throw new Error(INVALID_CREDENTIALS_ERROR);
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
        throw new Error(INVALID_CREDENTIALS_ERROR);
    }

    return usuario;
};

export const signToken = (usuario: { id?: string; _id?: unknown; rol?: string }): string => {
    const secret = process.env.JWT_SECRET || 'secreto_temporal';
    const userId = usuario.id ?? String(usuario._id);

    return jwt.sign(
        {
            id: userId,
            sub: userId,
            rol: usuario.rol || 'cliente'
        },
        secret,
        {
            expiresIn: '1h'
        }
    );
};