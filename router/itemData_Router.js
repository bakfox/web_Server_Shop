import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

//아이템 전부 받아오기
router.get('/items/:page', async (req, res, next) => {
  const { page } = req.params;

  const items = await prisma.user_Data.findMany({
    skip: +page * 10, // 몇 개를 건너뛸지
    take: 10, // 몇 개를 가져올지
  });
  if (!items) {
    next();
  }
  res.status(200).json({
    message: ' 불러오기 성공! ',
    data: items,
  });
});

//아이템 체크 세부
router.get('/item/:itemPID', async (req, res, next) => {
  const { itemPID } = req.params;

  const items = await prisma.item_DataBase.findFirst({
    where: { itemPID: +itemPID },
  });
  if (!items) {
    next();
  }
  res.status(200).json({
    message: ' 불러오기 성공! ',
    data: items,
  });
});

//아이템 데이터 베이스에 넣기
router.post('/setItem', async (req, res, next) => {
  const { itemName, itemText, itemImage, itemValue, itemEffect, itemType } =
    req.body;
  const items = await prisma.item_DataBase.findFirst({
    where: { itemName: +itemName },
  });
  if (items) {
    next();
  }
  const makeItems = await prisma.item_DataBase.create({
    data: { itemName, itemText, itemImage, itemValue, itemEffect, itemType },
  });
  return res.status(200).json({
    message: '아이템을 성공적으로 등록했습니다',
  });
});

//아이템 업데이트
router.put('/updateItem/:itemPID', async (req, res, next) => {
  const { itemPID } = req.params; //업데이트할 아이템의 ID
  const { itemName, itemText, itemImage, itemValue, itemEffect, itemType } =
    req.body;

  //업데이트할 아이템이 존재하는지 확인
  const item = await prisma.item_DataBase.findUnique({
    where: { itemPID: +itemPID }, //아이템 ID로 검색
  });
  if (!item) {
    next();
  }
  // 아이템 업데이트
  const updatedItem = await prisma.item_DataBase.update({
    where: { itemPID: +itemPID },
    data: { itemName, itemText, itemImage, itemValue, itemEffect, itemType },
  });
  return res.status(201).json({
    message: '아이템이 성공적으로 업데이트되었습니다.',
  });
});

//삭제용도
router.delete('/deleteItem/:itemPID', async (req, res, next) => {
  const { itemPID } = req.params;
  const item = await prisma.item_DataBase.findUnique({
    where: { itemPID: +itemPID }, //아이템 ID로 검색
  });
  if (!item) {
    next();
  }
  await prisma.item_DataBase.delete({
    where: { itemPID: +itemPID },
  });
  return res.status(201).json({
    message: '아이템이 성공적으로 삭제했습니다.',
  });
});

export default router;
