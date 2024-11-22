import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';

import authMiddleware from '../middlewares/auth.middleware.js';
import {
  ACCESS_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_SECRET_KEY,
  createAccessToken,
  createRefreshToken,
} from '../key/jwt_Key.js';

const tokenStorages = {};
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
    return res.status(409).json({ message: ' 이미 존재하는 닉네임 입니다. ' });
  } else if (checkUserName[1]) {
    return res.status(409).json({ message: ' 이미 존재하는 아이디 입니다. ' });
  }
  const hashdePW = await bcrypt.hash(userPassword, 10);
  const user = await prisma.user_Data.create({
    data: { userName, userID, userPassword: hashdePW },
  });

  return res.status(201).json({ message: ' 당신은 이제 저희 회원입니다! ' });
});

// 로그인 api
router.post('/singIn', async (req, res, next) => {
  const { userID, userPassword } = req.body;
  const user = await prisma.user_Data.findFirst({ where: { userID } });
  if (user) {
    return res.status(401).json({ message: ' 존재하지 않는 아이디 입니다. ' });
  }
  if (!(await bcrypt.compare(userPassword, user.userPassword))) {
    return res
      .status(401)
      .json({ message: ' 비밀번호가 일치하지  않습니다. ' });
  }
  // 토큰 생성
  const accessToken = createAccessToken(user.userPID);
  const refreshToken = createRefreshToken(user.userPID);
  //토큰 저장
  const token = await prisma.tokenStorages.create({
    data: {
      userPID: user.userPID,
      userIP: req.ip,
      userAgent: req.headers['user-agent'],
      expireAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  res.cookie('accessToken', accessToken, { httpOnly: true });
  res.cookie('refreshToken', refreshToken);

  return res.status(200).json({ message: ' 로그인 성공하였습니다.' });
});

// 쿠키 기반으로 체크하는 미들웨어 변경해야함.
router.get('/users', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user;

  const user = await prisma.user_Data.findFirst({
    where: { userPID: +userPID },
  });
});

export default router;
