import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import config from '../config';

const secret: Secret = config.jwtSecret;

export const signAccessToken = (payload: object) => {
    return jwt.sign(
        payload,
        secret,
        { expiresIn: config.accessTokenExpires as SignOptions['expiresIn'] }
    );
};

export const signRefreshToken = (payload: object) => {
    return jwt.sign(
        payload,
        secret,
        { expiresIn: `${config.refreshTokenExpiresDays}d` as SignOptions['expiresIn'] }
    );
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, secret);
};



