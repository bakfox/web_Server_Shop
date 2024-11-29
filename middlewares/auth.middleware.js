import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import { ACCESS_TOKEN_SECRET_KEY } from '../key/jwt_Key.js';

export default async function (req, res, next) {
  try {
    // 헤더로 변경 accessToken 가져오기
    const authorizationHeader = req.headers['authorization'];

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Bearer 토큰이 아닙니다.' });
    }

    const token = authorizationHeader.split(' ')[1];

    // 토큰 검증 및 사용자 확인
    const payload = validateToken(token, ACCESS_TOKEN_SECRET_KEY);
    const { userPID } = payload;

    // 사용자 정보 가져오기
    const user = await prisma.user_Data.findFirst({
      where: { userPID: +userPID },
    });

    if (!user) {
      return res.status(404).json({ message: '사용자가 존재하지 않습니다.' });
    }

    // 사용자 데이터를 req에 추가하고 다음 미들웨어로 넘기기
    req.user = user;
    next();
  } catch (error) {
    // 에러 처리
    res
      .status(500)
      .json({ message: error.message || '서버 에러가 발생했습니다.' });
  }
}

// 토큰 검증 함수
function validateToken(token, secretKey) {
  try {
    return jwt.verify(token, secretKey);
  } catch (err) {
    return null;
  }
}
