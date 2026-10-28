import { Request, Response, NextFunction } from 'express'
import { ZodType } from 'zod'
import { httpStatus } from '../constants/httpsNumbers'

export const validate = (source: 'body' | 'params' | 'query', schema: ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const details = result.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message
            }));
            res.status(httpStatus.REQUEST_ERROR).json({ error: { message: 'Datos invalidos', details } })
            return;
        }

        if (source === 'body') req.body = result.data
        next();
    };
};