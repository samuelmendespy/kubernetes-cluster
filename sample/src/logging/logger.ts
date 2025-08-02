import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';

export class Logger {
    private logger: WinstonLogger;

    constructor() {
        this.logger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new transports.Console(),
                new transports.File({ filename: 'error.log', level: 'error' }),
                new transports.File({ filename: 'combined.log' })
            ],
        });
    }

    logInfo(message: string) {
        this.logger.info(message);
    }

    logError(message: string) {
        this.logger.error(message);
    }

    logDebug(message: string) {
        this.logger.debug(message);
    }
}