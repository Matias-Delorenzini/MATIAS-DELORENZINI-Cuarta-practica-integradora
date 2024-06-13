import winston from "winston";
import config from "../config/config.js";

console.log(config)

const customLevelsOptions = {
    levels: {
        fatal: 0,
        error: 1,
        warning: 2,
        info: 3,
        http: 4,
        debug: 5,
    },
    colors: {
        fatal: 'red',
        error: 'yellow',
        warning: 'magenta',
        info: 'cyan',
        http: 'blue',
        debug: 'green',
    }
}

winston.addColors(customLevelsOptions.colors);

let logger;

if (config.logger == "PRODUCTION") {

    console.log("Production Logger inicializado");

    logger = winston.createLogger({
        levels: customLevelsOptions.levels,
        transports: [
            new winston.transports.Console({
                level: "info",
                format: winston.format.combine(
                    winston.format.colorize({ all: true }),
                    winston.format.simple()
                )
            }),
            new winston.transports.File({
                filename: './errors.log', 
                level:'error',
                format: winston.format.simple()
            })
        ]
    })

} 

if (config.logger == "DEVELOPMENT") {

    console.log("Development Logger inicializado");

    logger = winston.createLogger({
        levels: customLevelsOptions.levels,
        transports: [
            new winston.transports.Console({
                level: "debug",
                format: winston.format.combine(
                    winston.format.colorize({ all: true }),
                    winston.format.simple()
                )
            }),
            new winston.transports.File({
                filename: './errors.log', 
                level:'error',
                format: winston.format.simple()
            })
        ]
    })

}

export const addLogger = (req, res, next) => {
    req.logger = logger;
    req.logger.http(`${req.method} en ${req.url} - ${new Date().toLocaleTimeString()}`);
    next();
}

export { logger };