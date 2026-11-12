import express, { Router } from 'express';
import {
    redirectToServices,
    listServicesView,
    serviceDetailView,
    requestServiceSubmit,
    myRequestsView
} from '../controllers/views.controller';
import {
    loginForm,
    loginSubmit,
    registerForm,
    registerSubmit,
    logoutSubmit
} from '../controllers/auth-views.controller';
import {
    verifyEmailPage,
    resendVerificationSubmit,
    forgotPasswordForm,
    forgotPasswordSubmit,
    resetPasswordForm,
    resetPasswordSubmit
} from '../controllers/account-views.controller';
import { loadUser, redirectIfAuthenticated, requireViewAuth } from '../middleware/view-session.middleware';
import { isGoogleEnabled } from '../config/passport';

const router = Router();

// Solo afecta a las rutas HTML: formularios y sesión por cookie
router.use(express.urlencoded({ extended: false }));
router.use(loadUser);
router.use((req, res, next) => {
    res.locals.googleEnabled = isGoogleEnabled();
    res.locals.currentPath = req.path; // para volver tras "Reenviar correo"
    next();
});

router.get('/', redirectToServices);
router.get('/servicios', listServicesView);
router.get('/servicios/:id', serviceDetailView);
// La sesión se revisa dentro: sin sesión redirige a /login?next=/servicios/:id
router.post('/servicios/:id/solicitar', requestServiceSubmit);
router.get('/mis-solicitudes', requireViewAuth, myRequestsView);

router.get('/login', redirectIfAuthenticated, loginForm);
router.post('/login', loginSubmit);
router.get('/registro', redirectIfAuthenticated, registerForm);
router.post('/registro', registerSubmit);
router.post('/logout', logoutSubmit);

// Verificación de correo y recuperación de contraseña (enlaces de los correos)
router.get('/verificar-email', verifyEmailPage);
router.post('/reenviar-verificacion', requireViewAuth, resendVerificationSubmit);
router.get('/olvide-password', redirectIfAuthenticated, forgotPasswordForm);
router.post('/olvide-password', forgotPasswordSubmit);
router.get('/restablecer-password', resetPasswordForm);
router.post('/restablecer-password', resetPasswordSubmit);

export default router;
