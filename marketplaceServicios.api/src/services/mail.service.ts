import nodemailer, { Transporter } from 'nodemailer';
import { moduleLogger } from '../config/logger';

const log = moduleLogger('mail');

/*
 * Servicio único de correo.
 *
 * Transporte (según el entorno):
 *   1. SMTP_HOST definido      → SMTP (Mailtrap, Gmail, proveedor real…)
 *   2. sin SMTP_HOST y NODE_ENV != production → cuenta de prueba Ethereal automática;
 *      cada envío loguea una URL de vista previa para ver el correo en el navegador
 *   3. MAIL_DISABLED=true, o producción sin SMTP → no se envía nada (warn en log)
 *
 * Regla: un fallo de correo NUNCA tumba la petición. sendMail no lanza; devuelve false y loguea warn.
 * Nunca se loguea el cuerpo del correo (lleva tokens).
 */

export interface MailMessage {
    to: string;
    subject: string;
    html: string;
    text: string;
}

type Mode = 'smtp' | 'ethereal' | 'disabled';

let transporterPromise: Promise<{ transporter: Transporter | null; mode: Mode }> | null = null;

const maskEmail = (email: string) => {
    const [user = '', domain = ''] = email.split('@');
    return `${user.slice(0, 1)}***@${domain}`;
};

const createTransporter = async (): Promise<{ transporter: Transporter | null; mode: Mode }> => {
    if (process.env.MAIL_DISABLED === 'true') {
        log.warn('Envío de correos desactivado (MAIL_DISABLED=true)');
        return { transporter: null, mode: 'disabled' };
    }

    const host = process.env.SMTP_HOST?.trim();
    if (host) {
        const port = Number(process.env.SMTP_PORT) || 587;
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
            ...(process.env.SMTP_USER
                ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } }
                : {})
        });
        log.info({ transport: 'smtp', host, port }, `Transporte SMTP: ${host}:${port}`);
        return { transporter, mode: 'smtp' };
    }

    if (process.env.NODE_ENV === 'production') {
        log.warn('Sin SMTP_HOST en producción: los correos NO se enviarán');
        return { transporter: null, mode: 'disabled' };
    }

    try {
        const cuenta = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: cuenta.smtp.host,
            port: cuenta.smtp.port,
            secure: cuenta.smtp.secure,
            auth: { user: cuenta.user, pass: cuenta.pass }
        });
        log.info({ transport: 'ethereal', inbox: 'https://ethereal.email/login', user: cuenta.user }, `Transporte Ethereal (pruebas). Bandeja: https://ethereal.email/login usuario: ${cuenta.user}`);
        return { transporter, mode: 'ethereal' };
    } catch (error) {
        log.warn({ err: error }, 'No se pudo crear la cuenta Ethereal; correos desactivados');
        return { transporter: null, mode: 'disabled' };
    }
};

const getTransporter = () => {
    transporterPromise ??= createTransporter();
    return transporterPromise;
};

export const sendMail = async (message: MailMessage): Promise<boolean> => {
    try {
        const { transporter, mode } = await getTransporter();
        if (!transporter) {
            log.warn({ to: maskEmail(message.to), subject: message.subject }, `No enviado "${message.subject}" a ${maskEmail(message.to)}: transporte desactivado`);
            return false;
        }

        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || 'Marketplace Servicios <no-reply@marketplace.local>',
            ...message
        });

        const preview = mode === 'ethereal' ? nodemailer.getTestMessageUrl(info) : false;
        log.info(
            { to: maskEmail(message.to), subject: message.subject, messageId: info.messageId, ...(preview ? { preview } : {}) },
            `Enviado "${message.subject}" a ${maskEmail(message.to)}${preview ? ` · vista previa: ${preview}` : ''}`
        );
        return true;
    } catch (error) {
        log.warn(
            { to: maskEmail(message.to), subject: message.subject, err: error },
            `Falló el envío de "${message.subject}" a ${maskEmail(message.to)}: ${(error as Error).message}`
        );
        return false;
    }
};

// Para disparar sin esperar (la respuesta HTTP no depende del correo)
export const sendMailInBackground = (message: MailMessage) => {
    void sendMail(message);
};

/* Plantillas */

export const appUrl = () =>
    (process.env.APP_URL?.trim() || `http://localhost:${Number(process.env.PORT) || 3000}`).replace(/\/+$/, '');

const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const layout = (titulo: string, cuerpo: string) => `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:32px">
    <h1 style="font-size:20px;margin:0 0 16px;color:#2563eb">${escapeHtml(titulo)}</h1>
    ${cuerpo}
    <p style="margin-top:32px;font-size:12px;color:#64748b">Marketplace Servicios · Si no solicitaste esto, ignora este correo.</p>
  </div>
</body></html>`;

const boton = (url: string, texto: string) =>
    `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">${escapeHtml(texto)}</a></p>
     <p style="font-size:12px;color:#64748b;word-break:break-all">Si el botón no funciona, copia este enlace:<br>${escapeHtml(url)}</p>`;

const formatoDuracion = (ms: number) => {
    const min = Math.round(ms / 60000);
    if (min < 60) return `${min} minutos`;
    const h = Math.round(min / 60);
    return h === 1 ? '1 hora' : `${h} horas`;
};

export const verificationEmail = (to: string, nombre: string, url: string, ttlMs: number): MailMessage => ({
    to,
    subject: 'Verifica tu correo',
    html: layout('Verifica tu correo', `
        <p>Hola ${escapeHtml(nombre)},</p>
        <p>Confirma que este correo es tuyo para poder solicitar servicios y dejar reseñas.</p>
        ${boton(url, 'Verificar correo')}
        <p style="font-size:13px;color:#64748b">El enlace vence en ${formatoDuracion(ttlMs)} y solo se puede usar una vez.</p>`),
    text: `Hola ${nombre},\n\nConfirma tu correo abriendo este enlace:\n${url}\n\nVence en ${formatoDuracion(ttlMs)} y solo se puede usar una vez.\nSi no creaste una cuenta, ignora este correo.`
});

export const resetPasswordEmail = (to: string, nombre: string, url: string, ttlMs: number): MailMessage => ({
    to,
    subject: 'Restablece tu contraseña',
    html: layout('Restablece tu contraseña', `
        <p>Hola ${escapeHtml(nombre)},</p>
        <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>
        ${boton(url, 'Elegir nueva contraseña')}
        <p style="font-size:13px;color:#64748b">El enlace vence en ${formatoDuracion(ttlMs)} y solo se puede usar una vez. Tu contraseña actual sigue funcionando hasta que la cambies.</p>`),
    text: `Hola ${nombre},\n\nPara elegir una nueva contraseña abre este enlace:\n${url}\n\nVence en ${formatoDuracion(ttlMs)} y solo se puede usar una vez.\nSi no lo pediste, ignora este correo: tu contraseña no cambia.`
});

export type EstadoNotificable = 'aceptada' | 'completada';

export interface BookingMailData {
    nombre: string;
    servicio: string;
    fechaProgramada?: Date | undefined;
    direccion?: string | undefined;
}

const formatoFecha = (d: Date) =>
    d.toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' });

export const bookingStatusEmail = (
    to: string,
    estado: EstadoNotificable,
    data: BookingMailData
): MailMessage => {
    const url = `${appUrl()}/mis-solicitudes`;
    const detalles = [
        `Servicio: ${data.servicio}`,
        ...(data.fechaProgramada ? [`Fecha: ${formatoFecha(data.fechaProgramada)}`] : []),
        ...(data.direccion ? [`Dirección: ${data.direccion}`] : [])
    ];
    const detallesHtml = `<ul style="padding-left:20px;color:#334155">${detalles
        .map((d) => `<li>${escapeHtml(d)}</li>`)
        .join('')}</ul>`;

    if (estado === 'aceptada') {
        return {
            to,
            subject: `Tu solicitud fue aceptada: ${data.servicio}`,
            html: layout('¡Tu solicitud fue aceptada!', `
                <p>Hola ${escapeHtml(data.nombre)},</p>
                <p>El proveedor aceptó tu solicitud. Estos son los datos:</p>
                ${detallesHtml}
                ${boton(url, 'Ver mis solicitudes')}`),
            text: `Hola ${data.nombre},\n\nEl proveedor aceptó tu solicitud.\n\n${detalles.join('\n')}\n\nVer mis solicitudes: ${url}`
        };
    }

    return {
        to,
        subject: `Servicio completado: ${data.servicio}`,
        html: layout('Servicio completado', `
            <p>Hola ${escapeHtml(data.nombre)},</p>
            <p>El proveedor marcó tu servicio como completado. ¡Gracias por usar Marketplace Servicios!</p>
            ${detallesHtml}
            <p>Ya puedes dejar una reseña sobre el servicio.</p>
            ${boton(url, 'Ver mis solicitudes')}`),
        text: `Hola ${data.nombre},\n\nEl proveedor marcó tu servicio como completado.\n\n${detalles.join('\n')}\n\nYa puedes dejar una reseña. Ver mis solicitudes: ${url}`
    };
};
