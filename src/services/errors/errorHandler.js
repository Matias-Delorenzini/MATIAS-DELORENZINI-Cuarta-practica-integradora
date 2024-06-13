import { CustomError } from "./errors.js"
import { logger } from "../../utils/logger.js";

function errorHandler(err, req, res, next) {
    if (err instanceof CustomError) {
        logger.error(`${err.code}: ${err.message}`)
        res.status(err.status).json({
            error: err.code,
            message: err.message
        });
    } else {
        logger.error(err);
        res.status(500).json({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Ocurrió un error interno en el servidor.'
        });
    }
}

export { errorHandler };
