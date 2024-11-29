import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { Prisma } from '@prisma/client';
import removeAtIndex from '../utils/model/removeIndex.js';
import errModel from '../utils/model/errModel.js';

const router = express.Router();

//장착 인벤토리 번호 받아옴 for문으로 반복해서 생성할때 id로 지정.
router.patch(
  '/inventory_Equip/:inventoryIndex',
  authMiddleware,
  async (req, res, next) => {
    const { inventoryIndex } = req.params;
    const { userPID } = req.user;

    const inventory = await prisma.inventory_Data.findFirst({
      where: { userPID: +userPID },
    });
    if (!inventory) {
      return next(errModel(404, '인벤토리 데이터가 없습니다.')); //인벤토리가 없음!
    } else if (!inventory.itemPID || inventory.itemPID.length === 0) {
      return next(errModel(404, '인벤토리내에 아이템 데이터가 없습니다.')); //인벤토리 내에 아이템이 없음!
    } else if (inventory.itemPID[inventoryIndex] === undefined) {
      return next(errModel(400, '지정하신 인벤토리에 아이템이 없습니다.'));
    }

    const item = await prisma.item_DataBase.findFirst({
      where: { itemPID: +inventory.itemPID[inventoryIndex] },
    });
    if (!item) {
      return next(errModel(404, '아이템 데이터가 없습니다.')); //아이템이 존재하지 않음!
    }
    const equipInventory = await prisma.equipInventory_Data.findFirst({
      where: { userPID: +userPID },
    });
    const character = await prisma.character_Data.findFirst({
      where: { userPID: +userPID },
      select: { characterEquip: true },
    });
    console.log(
      +equipInventory.itemPID.length >= +character.characterEquip,
      equipInventory.itemPID.length,
      character.characterEquip,
    );
    if (equipInventory.itemPID.length >= character.characterEquip) {
      return next(errModel(400, '장비창에 빈 공간이 없습니다.'));
    }
    //데이터 가공 -
    const eTempPid = [...equipInventory.itemPID, item.itemPID];
    const eTempName = [...equipInventory.itemName, item.itemName];
    const eTempEffect = [...equipInventory.itemEffect, item.itemEffect];
    const eTempType = [...equipInventory.item_Type, item.item_Type];

    const tempPid = removeAtIndex(inventory.itemPID, +inventoryIndex);
    const tempName = removeAtIndex(inventory.itemName, +inventoryIndex);
    const tempCount = removeAtIndex(inventory.itemCount, +inventoryIndex);

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
        await tx.equipInventory_Data.update({
          where: { userPID: +userPID },
          data: {
            itemPID: eTempPid,
            itemName: eTempName,
            itemEffect: eTempEffect,
            item_Type: eTempType,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
    return res
      .status(201)
      .json({ message: '아이템을 성공적으로 장착했습니다!' });
  },
);

// 장비 해제 역순으로
router.patch(
  '/equipInventory_Unequip/:equipInventoryIndex',
  authMiddleware,
  async (req, res, next) => {
    const { equipInventoryIndex } = req.params;
    const { userPID } = req.user;
    const inventory = await prisma.inventory_Data.findFirst({
      where: { userPID: +userPID },
    });
    console.log(inventory);
    if (!inventory) {
      return next(errModel(404, '인벤토리내에 아이템 데이터가 없습니다.')); //인벤토리가 없음!
    }
    const character = await prisma.character_Data.findFirst({
      where: { userPID: +userPID },
      select: { characterBackpack: true },
    });
    if (inventory.itemPID.length >= character.characterBackpack) {
      return next(errModel(400, '인벤토리가 가득 차서 해제할 수 없습니다.')); // 인벤토리 가득참!
    }
    const equipInventory = await prisma.equipInventory_Data.findFirst({
      where: { userPID: +userPID },
    });
    if (!equipInventory) {
      return next(errModel(404, '인벤토리 데이터가 없습니다.')); //없으면 이상한거임.
    } else if (
      equipInventory.itemPID.length === 0 ||
      equipInventory.itemPID[equipInventoryIndex] == undefined
    ) {
      // 장착칸에 아무것도 없음
      return next(
        errModel(404, '지정하신 인벤토리 칸에 아이템 데이터가 없습니다.'),
      );
    }
    const tempPid = [
      ...inventory.itemPID,
      equipInventory.itemPID[equipInventoryIndex],
    ];
    const tempName = [
      ...inventory.itemName,
      equipInventory.itemName[equipInventoryIndex],
    ];
    const tempCount = [...inventory.itemCount, 1];

    //데이터 가공 -
    const eTempPid = removeAtIndex(
      equipInventory.itemPID,
      +equipInventoryIndex,
    );
    const eTempName = removeAtIndex(
      equipInventory.itemName,
      +equipInventoryIndex,
    );
    const eTempEffect = removeAtIndex(
      equipInventory.itemEffect,
      +equipInventoryIndex,
    );
    const eTempType = removeAtIndex(
      equipInventory.item_Type,
      +equipInventoryIndex,
    );

    //저장은 장착 해제 동일함!
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
        await tx.equipInventory_Data.update({
          where: { userPID: +userPID },
          data: {
            itemPID: eTempPid,
            itemName: eTempName,
            itemEffect: eTempEffect,
            item_Type: eTempType,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
    return res
      .status(201)
      .json({ message: '아이템을 성공적으로 해제했습니다!' });
  },
);
//장비창 체크
router.get('/equipInventorys/:userPID', async (req, res, next) => {
  const { userPID } = req.user;
  const equipInventory = await prisma.equipInventory_Data.findFirst({
    where: { userPID: +userPID },
  });
  if (!equipInventory) {
    return next(errModel(404, '장비창 데이터가 없습니다.'));
  }
  return res.status(200).json({
    message: '아이템을 성공적으로 저장했습니다!',
    data: { inventory, equipInventory },
  });
});

//인벤토리 받아오기 세부 ( 본인만 )
router.get('/inventorys', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user;
  const inventory = await prisma.inventory_Data.findFirst({
    where: { userPID: +userPID },
  });
  if (!inventory) {
    return next(errModel(404, '인벤토리내 데이터가 없습니다.'));
  }
  const equipInventory = await prisma.equipInventory_Data.findFirst({
    where: { userPID: +userPID },
  });
  if (!equipInventory) {
    return next(errModel(404, '장비창 데이터가 없습니다.'));
  }
  return res.status(200).json({
    message: '아이템을 성공적으로 저장했습니다!',
    data: { inventory, equipInventory },
  });
});

export default router;
