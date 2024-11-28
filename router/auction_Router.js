import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// 경매장 아이템 확인 // 안팔린것만 확인
router.get('/auctions/:page', async (req, res, next) => {
  const { page } = req.params;

  const items = await prisma.auction_Data.findMany({
    where: {
      isSellItem: true,
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

// 경매장에 올린 내 아이템 확인 // 안팔린것만 확인
router.get('/auctions/:page', authMiddleware, async (req, res, next) => {
  const { page } = req.params;

  const items = await prisma.auction_Data.findMany({
    where: {
      userPID: req.user.userPID,
      isSellItem: true,
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
// 구매 아이템 세부 조회
router.get('/getauctions/:page', authMiddleware, async (req, res, next) => {
  const { page } = req.params;

  const sellItems = await prisma.auction_Get_Data.findMany({
    where: {
      userPID: req.user.userPID,
      isGetItem: false,
    },
    skip: +page * 10, //몇 개를 건너뛸지 페이지 네이션
    take: 10, //몇 개를 가져올지
  });
  if (!sellItems) {
    next();
  }
  res.status(200).json({
    message: ' 불러오기 성공! ',
    data: sellItems,
  });
});
// 판매 아이템 세부 조회 [ 보관함 임 ]
router.get('/setauctions/:page', authMiddleware, async (req, res, next) => {
  const { page } = req.params;

  const getItems = await prisma.auction_Data.findMany({
    where: {
      userPID: req.user.userPID,
      isSellItem: false,
    },
    skip: +page * 10, //몇 개를 건너뛸지 페이지 네이션
    take: 10, //몇 개를 가져올지
  });
  if (!getItems) {
    next();
  }
  res.status(200).json({
    message: ' 불러오기 성공! ',
    data: getItems,
  });
});
//아이템 체크 세부
router.get('/auction/:auctionPID', async (req, res, next) => {
  const { auctionPID } = req.params;

  const item_sell_data = await prisma.auction_Data.findFirst({
    where: { auctionPID: +auctionPID },
  });
  const item = await prisma.item_DataBase.findFirst({
    where: { itemPID: +item_sell_data.itemPID },
  });

  if (!item) {
    next();
  }
  res.status(200).json({
    message: ' 불러오기 성공! ',
    data: [item_sell_data, item],
  });
});

//경매장 데이터 베이스에 넣기
router.post(
  '/setAuction/:InventoryPID',
  authMiddleware,
  async (req, res, next) => {
    const { InventoryPID } = req.params;
    const { itemPID, sellValue, sellCount } = req.body;
    const { userPID, userName } = req.user;
    //아이템 정보 확인
    const item = await prisma.item_DataBase.findFirst({
      where: { itemPID: itemPID },
      select: {
        itemName: true,
      },
    });
    //인벤토리 찾기 인벤토리가 없거나 아이템이 없으면.에러
    const check_Inventory = await Inventory.find({ userPID }).exec();
    if (!check_Inventory) {
      next();
    } else if (!check_Inventory.itemPID[InventoryPID]) {
      next();
    }
    check_Inventory.itemPID.splice(InventoryPID, 1);
    check_Inventory.itemHaveCount.splice(InventoryPID, 1);
    check_Inventory.isItemEquip.splice(InventoryPID, 1);

    await Inventory.updateOne(
      { userPID: userPID }, //조건
      {
        $set: {
          itemPID: check_Inventory.itemPID,
          itemHaveCount: check_Inventory.itemHaveCount,
          isItemEquip: check_Inventory.isItemEquip,
        },
      },
    );
    //인벤토리 집어넣음
    // 등록
    const makeItems = await prisma.auction_Data.create({
      data: {
        itemPID: check_Inventory.itemPID[InventoryPID],
        userPID,
        userName,
        itemName: item.itemName,
        sellValue,
      },
    });
    return res.status(200).json({
      message: '아이템을 성공적으로 등록했습니다',
    });
  },
);
//보관함에 있는 아이템 받은지 체크용도
router.patch('/isGet/:auction_GetPID');
//등록취소 // 이거 하고 보관함으로 아이템 돌려줘야함
router.patch(
  '/deletAuction/:auctionPID',
  authMiddleware,
  async (req, res, next) => {
    const { auctionPID } = req.params;
    const { userPID } = req.user;

    const auction = await prisma.auction_Data.findUnique({
      where: { auctionPID: +auctionPID }, //아이템 ID로 검색
    });
    if (!auction) {
      next();
    } else if (auction.userPID != userPID) {
      next();
    } else if (auction.isSellItem === true) {
      next();
    }
    //이제 있는거 확인하면 Get data 테이블로 보내줌
    await prisma.$transaction(
      async (tx) => {
        await tx.auction_Get_Data.create({
          where: { userPID: +userPID }, //값 받아오기
          date: {
            userPID,
            itemPID: auction.itemPID,
            GetCount: auction.sellCount,
            isGetItem: false,
          },
        });
        //원래 있던 테이블 삭제
        await tx.auction_Data.delete({
          where: { auctionPID: +auctionPID },
        });
        return;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return res.status(201).json({
      message: '아이템이 성공적으로 삭제했습니다.',
    });
  },
);
//판매 보상 획득용도 //골드 획득과 db 삭제를 동시에 해야함
router.patch(
  '/getGoldAuction/:auctionPID',
  authMiddleware,
  async (req, res, next) => {
    const { auctionPID } = req.params;
    const { userPID } = req.user;

    const auction = await prisma.auction_Data.findUnique({
      where: { auctionPID: +auctionPID }, //아이템 ID로 검색
    }); //데이터가 없다!
    if (!auction) {
      next();
    } //다른 유저입니다!
    else if (auction.userPID != userPID) {
      next();
    } else if (auction.isSellItem) {
      next();
    }

    //이제 실질적인
    const [character] = await prisma.$transaction(
      async (tx) => {
        const check = await tx.character_Data.findFirst({
          where: { userPID: +userPID }, //값 받아오기
          select: {
            characterGold: true, //골드만 받아오기
          },
        });
        const character = await tx.item_DataBase.update({
          where: { itemPID: +auction.itemPID }, //캐릭터 다시 찾아서 데이터 집어넣기
          data: { pri: +(auction.sellValue + check.characterGold) },
        });
        //최근 팔린 값 던져주기
        const item = await tx.character_Data.update({
          where: { userPID: +userPID },
          data: { recentlySoldPrice: +auction.sellValue },
        });
        //삭제
        await tx.item_DataBase.delete({
          where: { auctionPID: +auctionPID },
        });
        return [character];
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
    return res.status(201).json({
      message: '골드를 성공적으로 획득했습니다.',
    });
  },
);

export default router;
