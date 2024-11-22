import JWT from 'jsonwebtoken';

export const ACCESS_TOKEN_SECRET_KEY = `MeowMeow`; // Access Token의 비밀 키를 정의합니다.
export const REFRESH_TOKEN_SECRET_KEY = `NyaNya`; // Refresh Token의 비밀 키를 정의합니다.

export function createAccessToken(user_id) {
  JWT.sign(
    {
      userPID: user_id,
    },
    ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: '1h' },
  );
}
export function createRefreshToken(user_id) {
  JWT.sign(
    {
      userPID: user_id,
    },
    REFRESH_TOKEN_SECRET_KEY,
    { expiresIn: '1d' },
  );
}
