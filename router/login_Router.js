import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import authMiddleware from '../middlewares/auth.middleware.js';

import jwt from 'jsonwebtoken';

import { createAccessToken } from '../key/jwt_Key.js';
import errModel from '../utils/model/errModel.js';
import userJoiSchema from '../utils/model/userjoiModel.js';

const router = express.Router();

// 회원가입 api
router.post('/singUp', async (req, res, next) => {
  const { userName, userID, userPassword, checkPassword } = req.body;
  console.log('실행중-1');
  if (userPassword != checkPassword) {
    return next(
      errModel(400, '확인용 페스워드와 입력하신 페스워드가 일치하지 않습니다.'),
    );
  }
  console.log('비밀번호 일치확인-1');
  const { error } = userJoiSchema.validate({ userID, userPassword });
  if (error) {
    return next(errModel(400, `회원가입에 실패하였습니다.. ${error.message}`));
  }
  console.log('조건 지나감1');
  const checkUserName = await prisma.user_Data.findFirst({
    where: { userName: userName },
  });
  const checkUserID = await prisma.user_Data.findFirst({
    where: { userID: userID },
  });
  // 체크용도 이름이랑 아이디
  if (checkUserName) {
    return next(errModel(400, '이미 다른 사용자가 사용중인 이름입니다.'));
  } else if (checkUserID) {
    return next(errModel(400, '이미 다른 사용자가 사용중인 아이디입니다.'));
  }
  const hashdePW = await bcrypt.hash(userPassword, 10);
  const user = await prisma.user_Data.create({
    data: { userName, userID, userPassword: hashdePW },
  });

  return res.status(201).json({
    message: ' 당신은 이제 저희 회원입니다! ',
    data: { userName, userID },
  });
});

// 로그인 api
router.post('/singIn', async (req, res, next) => {
  const { userID, userPassword } = req.body;
  const user = await prisma.user_Data.findFirst({ where: { userID } });
  if (!user) {
    return next(errModel(404, '사용자가 존재하지 않습니다.'));
  }
  if (!(await bcrypt.compare(userPassword, user.userPassword))) {
    return next(errModel(400, '비밀번호가 틀립니다..'));
  }
  // 토큰 생성
  const accessToken = createAccessToken(user.userPID);

  //헤더로 저장
  res.setHeader('authorization', `Bearer ${accessToken}`);

  return res.status(200).json({ message: ' 로그인 성공하였습니다.' });
});
//유저 데이터 세부
router.get('/users', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user;

  const user = await prisma.user_Data.findFirst({
    where: { userPID: +userPID },
  });
  if (!user) {
    return next(errModel(404, '당신은 잘못된 유저입니다.'));
  }
  res.status(200).json({
    message: ' 불러오기 성공! ',
    data: user,
  });
});
export default router;
