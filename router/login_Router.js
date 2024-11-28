import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import authMiddleware from '../middlewares/auth.middleware.js';

import jwt from 'jsonwebtoken';

import { createAccessToken } from '../key/jwt_Key.js';

const router = express.Router();

// 회원가입 api
router.post('/singUp', async (req, res, next) => {
  const { userName, userID, userPassword } = req.body;

  const checkUserName = await prisma.user_Data.findMany({
    where: { userName },
    where: { userID },
  });
  // 체크용도 이름이랑 아이디
  if (checkUserName[0]) {
    next();
  } else if (checkUserName[1]) {
    next();
  }
  const hashdePW = await bcrypt.hash(userPassword, 10);
  const user = await prisma.user_Data.create({
    data: { userName, userID, userPassword: hashdePW },
  });

  return res.status(201).json({ message: ' 당신은 이제 저희 회원입니다! ' });
});
// 토큰 검증 함수
function validateToken(token, secretKey) {
  try {
    return jwt.verify(token, secretKey);
  } catch (err) {
    return null;
  }
}
//진짜 토큰 테스트용도
router.post('/rogin_test/token', async (req, res) => {
  const authorizationHeader = req.headers['authorization'];

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bearer 토큰이 아닙니다.' });
  }

  const token = authorizationHeader.split(' ')[1];

  const payload = validateToken(token, 'MeowMeow');
  const { userPID } = payload;
  // 토큰 검증 및 사용자 확인
  return res.status(201).json({
    message: ' 당신은 이제 저희 회원입니다! ',
    data: {
      payload,
      token,
      userPID,
    },
  });
});

// 로그인 api
router.post('/singIn', async (req, res, next) => {
  const { userID, userPassword } = req.body;
  const user = await prisma.user_Data.findFirst({ where: { userID } });
  if (!user) {
    next();
  }
  if (!(await bcrypt.compare(userPassword, user.userPassword))) {
    next();
  }
  // 토큰 생성
  const accessToken = createAccessToken(user.userPID);

  //헤더로 저장
  res.setHeader('authorization', `Bearer ${accessToken}`);

  return res.status(200).json({ message: ' 로그인 성공하였습니다.' });
});

router.get('/users', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user;

  const user = await prisma.user_Data.findFirst({
    where: { userPID: +userPID },
  });
  if (!user) {
    next();
  }
  res.status(200).json({
    message: ' 불러오기 성공! ',
    data: user,
  });
});

export default router;
