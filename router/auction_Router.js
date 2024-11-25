import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 경매장 아이템 확인 // 안팔린것만 확인
router.get('/auctions/:page', async (req, res, next) => {
  const { page } = req.params;

  const items = await prisma.user_Data.findMany({
    where: {
      sellItem: false,
    },
    skip: +page * 10, //몇 개를 건너뛸지 페이지 네이션
    take: 10, //몇 개를 가져올지
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
router.get('/auction/:itemPID', async (req, res, next) => {
  const { itemPID } = req.params;

  const item = await prisma.item_DataBase.findFirst({
    where: { itemPID: +itemPID },
  });
  if (!item) {
    next();
  }
  res.status(200).json({
    message: ' 불러오기 성공! ',
    data: item,
  });
});

//경매장 데이터 베이스에 넣기
router.post('/setAuction', authMiddleware, async (req, res, next) => {
  const { itemPID, sellValue, sellCount } = req.body;

  const makeItems = await prisma.item_DataBase.create({
    data: { itemPID, itemText, sellValue, itemValue, itemEffect, itemType },
  });
  return res.status(200).json({
    message: '아이템을 성공적으로 등록했습니다',
  });
});

//삭제용도 // 이거 하고 인벤토리로 아이템 돌려줘야함
router.delete(
  '/deleteAuction/:auctionPID',
  authMiddleware,
  async (req, res, next) => {
    const { auctionPID } = req.params;

    const auction = await prisma.auction_Data.findUnique({
      where: { auctionPID: +auctionPID }, //아이템 ID로 검색
    });
    if (!auction) {
      next();
    } else if (auction.userPID != req.user.userPID) {
      next();
    }
    await prisma.item_DataBase.delete({
      where: { auctionPID: +auctionPID },
    });
    return res.status(201).json({
      message: '아이템이 성공적으로 삭제했습니다.',
    });
  },
);

export default router;
