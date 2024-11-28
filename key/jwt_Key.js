import JWT from 'jsonwebtoken';

export const ACCESS_TOKEN_SECRET_KEY = `MeowMeow`; // accessToken의 비밀 키를 정의합니다.

export function createAccessToken(user_id) {
  return JWT.sign(
    {
      userPID: user_id,
    },
    ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: '1h' },
  );
}
