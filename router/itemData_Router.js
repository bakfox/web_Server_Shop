import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { Prisma } from '@prisma/client';
import removeAtIndex from '../utils/model/removeIndex.js';

const router = express.Router();

//아이템 전부 받아오기
router.get('/items/:page', async (req, res, next) => {
  const { page } = req.params;
  let page_temp = page * 10;
  const items = await prisma.item_DataBase.findMany({
    skip: page_temp, // 몇 개를 건너뛸지
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

// 아이템 구매
router.patch('/buyItem/:itemPID', authMiddleware, async (req, res, next) => {
  const { itemPID } = req.params;
  const { userPID } = req.user;
  const items = await prisma.item_DataBase.findFirst({
    where: { itemPID: +itemPID },
  });
  if (!items) {
    next();
  }
  const character = await prisma.character_Data.findFirst({
    where: { userPID: +userPID },
    select: {
      characterGold: true,
      characterBackpack: true,
    },
  });
  if (character.characterGold < items.itemValue) {
    next();
  }
  //인벤토리 체크
  const inventory = await prisma.inventory_Data.findFirst({
    where: { userPID: +userPID },
  });
  if (character.characterBackpack <= inventory.itemPID.lenght) {
    next();
  }
  //데이터들 가공
  const tempGold = character.characterGold - items.itemValue;
  const tempPid = [...inventory.itemPID, items.itemPID];
  const tempName = [...inventory.itemName, items.itemName];
  const tempCount = [...inventory.itemCount, 1];

  // 검사 끝나면 인벤에 집어넣기
  await prisma.$transaction(
    async (tx) => {
      await tx.inventory_Data.update({
        where: { userPID: +userPID },
        data: {
          itemPID: tempPid,
          itemName: tempName,
          itemCount: tempCount,
        },
      });
      await tx.character_Data.update({
        where: { userPID: +userPID },
        data: {
          characterGold: tempGold,
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
  res.status(200).json({
    message: ` ${items.itemName} 구매 완료 `,
  });
});
//아이템 판매
router.patch(
  '/sellItem/:inventoryIndex',
  authMiddleware,
  async (req, res, next) => {
    const { inventoryIndex } = req.params;
    const { userPID } = req.user;
    const inventory = await prisma.inventory_Data.findFirst({
      where: { userPID: +userPID },
    });
    if (!inventory) {
      next(); // 인벤토리가 없다
    } else if (inventory.itemPID[inventoryIndex] === undefined) {
      next(); //아이템이 없다.
    }
    const item = await prisma.item_DataBase.findFirst({
      where: { itemPID: +inventory.itemPID[inventoryIndex] },
    });
    const character = await prisma.character_Data.findFirst({
      where: { userPID: +userPID },
    });
    if (inventory.itemCount[inventoryIndex] > 1) {
      // 카운트가 하나보다 많다.
      //데이터 미리 계산
      const tempCount = [...inventory.itemCount];
      tempCount[targetIndex] -= 1;
      const tempGold = character.characterGold + item.itemValue;
      await prisma.$transaction(
        async (tx) => {
          await tx.inventory_Data.update({
            where: { userPID: +userPID },
            data: {
              itemCount: tempCount,
            },
          });
          await tx.character_Data.update({
            where: { userPID: +userPID },
            data: {
              characterGold: tempGold,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
    } else {
      //하나면 그 칸을 삭제함
      const tempGold = character.characterGold + item.itemValue;
      const tempPid = removeAtIndex(inventory.itemPID, +inventoryIndex);
      const tempName = removeAtIndex(inventory.itemName, +inventoryIndex);
      const tempCount = removeAtIndex(inventory.itemCount, +inventoryIndex);
      console.log(tempPid, tempName, tempCount, inventoryIndex);
      await prisma.$transaction(
        async (tx) => {
          await tx.inventory_Data.update({
            where: { userPID: +userPID },
            data: {
              itemPID: tempPid,
              itemName: tempName,
              itemCount: tempCount,
            },
          });
          await tx.character_Data.update({
            where: { userPID: +userPID },
            data: {
              characterGold: tempGold,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
    }
    res.status(200).json({
      message: ` ${item.itemName} 판매완료`,
    });
  },
);
//아이템 데이터 베이스에 넣기
router.post('/setItem', async (req, res, next) => {
  const { itemName, itemText, itemValue, itemEffect, item_Type } = req.body;
  const items = await prisma.item_DataBase.findFirst({
    where: { itemName },
  });
  if (items) {
    next();
  }
  const makeItems = await prisma.item_DataBase.create({
    data: { itemName, itemText, itemValue, itemEffect, item_Type },
  });
  return res.status(200).json({
    message: '아이템을 성공적으로 등록했습니다',
  });
});

//아이템 업데이트
router.patch('/updateItem/:itemPID', async (req, res, next) => {
  const { itemPID } = req.params; //업데이트할 아이템의 ID
  const { itemName, itemText, itemValue, itemEffect, item_Type } = req.body;

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
    data: { itemName, itemText, itemValue, itemEffect, item_Type },
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
