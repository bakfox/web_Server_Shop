import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import {
  ACCESS_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_SECRET_KEY,
} from '../key/jwt_Key.js';

export default async function (req, res, next) {
  try {
    // 쿠키에서 accessToken 가져오기
    let { accessToken } = req.cookies;

    // Access Token이 없거나 유효하지 않으면 Refresh Token으로 갱신
    if (!accessToken || !validateToken(accessToken, ACCESS_TOKEN_SECRET_KEY)) {
      const newToken = await checkAccessToken(req, res);

      if (!newToken) {
        // Refresh Token이 유효하지 않으면 checkAccessToken에서 응답 처리됨
        return;
      }

      // 새로운 Access Token 설정
      accessToken = newToken;
    }

    // 토큰 검증 및 사용자 확인
    const payload = validateToken(accessToken, ACCESS_TOKEN_SECRET_KEY);
    const { userID } = payload;

    // 사용자 정보 가져오기
    const user = await prisma.user_Data.findFirst({
      where: { userID: +userID },
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

async function checkAccessToken(req, res) {
  const refreshToken = req.cookies.refreshToken;

  // RefreshToken 존재 여부 확인
  if (!refreshToken) {
    res.status(400).json({ errorMessage: '토큰이 존재하지 않습니다.' });
    return null;
  }

  // RefreshToken 유효기간 확인
  const payload = validateToken(refreshToken, REFRESH_TOKEN_SECRET_KEY);
  if (!payload) {
    res.status(401).json({ errorMessage: '토큰이 유효하지 않습니다.' });
    return null;
  }

  // refreshToken 저장소에서 사용자 정보 확인
  const userInfo = await prisma.refreshToken.findFirst({
    where: { userPID: +refreshToken.userPID },
  });
  if (!userInfo) {
    res.status(419).json({
      errorMessage: '토큰의 정보가 서버에 존재하지 않습니다.',
    });
    return null;
  }

  // 새로운 AccessToken 생성
  const newAccessToken = createAccessToken(userInfo.id);

  // AccessToken을 안전하게 쿠키에 저장
  res.cookie('accessToken', newAccessToken, {
    httpOnly: true,
  });

  return newAccessToken;
}

// 토큰 검증 함수
function validateToken(token, secretKey) {
  try {
    return jwt.verify(token, secretKey);
  } catch (err) {
    return null;
  }
}
