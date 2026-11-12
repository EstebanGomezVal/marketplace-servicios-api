import 'express';

declare global {
  namespace Express {
    // @types/passport declara `Request.user?: Express.User` (vacía).
    // Se amplía aquí para que req.user siga siendo { id, rol } en todo el proyecto.
    interface User {
      id: string;
      rol: 'cliente' | 'proveedor' | 'admin';
    }

    interface Request {
      user?: User;
      // X-Request-Id de la petición (lo pone requestLogger)
      id?: string;
    }
  }
}

export {};
