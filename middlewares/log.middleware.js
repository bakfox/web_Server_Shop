import winston, { info } from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: new winston.transports.Console(),
});

export default function (req, res, next) {
  next();
}
