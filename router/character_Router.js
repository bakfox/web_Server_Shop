import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { Prisma } from '@prisma/client';
import errModel from '../utils/model/errModel.js';

const router = express.Router();

//캐릭터 데이터 받아오기( 보통 )
router.get('/character/:userPID', async (req, res, next) => {
  const { userPID } = req.params;

  const character = await prisma.character_Data.findFirst({
    where: { userPID: +userPID },
    select: {
      characterATCK: true,
      characterDEFEND: true,
      characterMACTK: true,
      characterLevel: true,
      characterHP: true,
    },
  });
  if (!character) {
    return next(errModel(404, '캐릭터 데이터가 없습니다.'));
  }
  const equipInventory = await prisma.equipInventory_Data.findFirst({
    where: { userPID: +userPID },
  });
  if (equipInventory.itemPID.length != 0) {
    for (let i = 0; i < equipInventory.itemPID.length; i++) {
      switch (equipInventory.item_Type[i]) {
        case 'HP':
          character.characterHP += equipInventory.itemEffect[i];
          break;
        case 'ATCK':
          character.characterATCK += equipInventory.itemEffect[i];
          break;
        case 'DEFEND':
          character.characterDEFEND += equipInventory.itemEffect[i];
          break;
        case 'MATCK':
          character.characterMACTK += equipInventory.itemEffect[i];
          break;
      }
    }
  }
  res.status(200).json({
    message: ' 불러오기 성공! ',
    data: character,
  });
});
//캐릭터 데이터 받아오기( 세부 )
router.get('/character', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user;

  const character = await prisma.character_Data.findFirst({
    where: { userPID: +userPID },
  });
  if (!character) {
    return next(errModel(404, '캐릭터 데이터가 없습니다.'));
  }
  const equipInventory = await prisma.equipInventory_Data.findFirst({
    where: { userPID: +userPID },
  });
  if (equipInventory.itemPID.length != 0) {
    for (let i = 0; i < equipInventory.itemPID.length; i++) {
      switch (equipInventory.item_Type[i]) {
        case 'HP':
          character.characterHP += equipInventory.itemEffect[i];
          break;
        case 'ATCK':
          character.characterATCK += equipInventory.itemEffect[i];
          break;
        case 'DEFEND':
          character.characterDEFEND += equipInventory.itemEffect[i];
          break;
        case 'MATCK':
          character.characterMACTK += equipInventory.itemEffect[i];
          break;
      }
    }
  }
  res.status(200).json({
    message: ' 불러오기 성공! ',
    data: character,
  });
});
//캐릭터 새로 생성
router.post('/newCharacter', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user;
  const character = await prisma.character_Data.findFirst({
    where: { userPID: +userPID },
  });
  //캐릭터 있으면 오류 발생
  if (character) {
    return next(errModel(400, '캐릭터가 이미 있습니다.'));
  }
  // 유저 데이터 생성 인벤이랑 전부다.
  prisma.$transaction(
    async (tx) => {
      const user = await tx.character_Data.create({
        data: { userPID },
      });
      const inventory = await tx.inventory_Data.create({
        data: { userPID },
      });
      const equipInventory = await tx.EquipInventory_Data.create({
        data: { userPID },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
  return res.status(200).json({
    message: ' 새로운 캐릭터를 등록했습니다. ',
  });
});

//캐릭터 경험치 레벨 저장용.
router.put('/character', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user; //업데이트할 유저 id
  const { characterLevel, characterStatusPoint, characterEXP } = req.body;

  //업데이트할 캐릭터 존재하는지 확인
  const check = await prisma.character_Data.findFirst({
    where: { userPID: +userPID }, //유저 id 로 검색
  });
  if (!check) {
    return next(errModel(404, '캐릭터 데이터가 없습니다.'));
  }
  // 캐릭터 업데이트
  const character = await prisma.character_Data.update({
    where: { userPID: +userPID },
    data: { characterLevel, characterStatusPoint, characterEXP },
  });
  return res.status(200).json({
    message: '캐릭터 성공적으로 업데이트되었습니다.',
  });
});

//캐릭터 능력치 조정
router.patch('/character/:UpStatus', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user; //업데이트할 아이템의 ID
  const { UpStatus } = req.params;

  //업데이트할 캐릭터 존재하는지 확인
  const check = await prisma.character_Data.findFirst({
    where: { userPID: +userPID }, //유저 id 로 검색
    select: {
      characterStatusPoint: true,
    },
  });
  if (!check) {
    next();
  } else if (check > 0) {
    next();
  }
  switch (UpStatus) {
    case 0:
      atck_up();
      break;
    case 1:
      mAtck_up();
      break;
    case 2:
      deffend_up();
      break;
    default:
      next();
  }
  const atck_up = async () => {
    await prisma.character_Data.update({
      where: { userPID: +userPID },
      data: {
        characterStatusPoint: {
          decrement: 1,
        },
        characterATCK: {
          increment: 1,
        },
      },
    });
  };
  const mAtck_up = async () => {
    await prisma.character_Data.update({
      where: { userPID: +userPID },
      data: {
        characterStatusPoint: {
          decrement: 1,
        },
        characterMATCK: {
          increment: 1,
        },
      },
    });
  };
  const deffend_up = async () => {
    await prisma.character_Data.update({
      where: { userPID: +userPID },
      data: {
        characterStatusPoint: {
          decrement: 1,
        },
        characterDEFEND: {
          increment: 1,
        },
      },
    });
  };
  // 캐릭터 업데이트

  return res.status(200).json({
    message: '캐릭터 성공적으로 업데이트되었습니다.',
  });
});

//골드 획득
router.patch('/getGold', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user; //유저 id

  let defolt_GetGold = 100;

  //업데이트할 캐릭터 존재하는지 확인
  const check = await prisma.character_Data.findFirst({
    where: { userPID: +userPID }, //아이템 ID로 검색
  });
  if (!check) {
    return next(errModel(404, '캐릭터 데이터가 없습니다.'));
  }
  // 캐릭터 업데이트
  const character = await prisma.character_Data.update({
    where: { userPID: +userPID },
    data: { characterGold: +(defolt_GetGold + check.characterGold) },
  });
  return res.status(200).json({
    message: '골드가 증가했습니다.',
  });
});

//골드 소모
router.patch('/lossGold', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user; //업데이트할 아이템의 ID
  const { lossGold } = req.body;

  //업데이트할 캐릭터 존재하는지 확인
  const check = await prisma.character_Data.findFirst({
    where: { userPID: +userPID }, //아이템 ID로 검색
  });
  if (!check) {
    return next(errModel(404, '캐릭터 데이터가 없습니다.'));
  }
  // 캐릭터 업데이트
  const character = await prisma.character_Data.update({
    where: { userPID: +userPID },
    data: {
      characterGold:
        check.characterGold - lossGold <= 0
          ? 0
          : check.characterGold - lossGold,
    },
  });
  return res.status(201).json({
    message: '골드가 감소했습니다.',
  });
});

//삭제용도 // 연결된 inventory도 삭제해야함
router.delete('/deleteCharacter', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user;
  const character = await prisma.character_Data.findUnique({
    where: { userPID: +userPID }, //아이템 ID로 검색
  });
  if (!character) {
    return next(errModel(404, '캐릭터 데이터가 없습니다.'));
  }
  await prisma.$transaction(
    async (tx) => {
      await tx.character_Data.delete({
        where: { userPID: +userPID },
      });
      await tx.inventory_Data.delete({
        where: { userPID: +userPID },
      });
      await tx.equipInventory_Data.delete({
        where: { userPID: +userPID },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
  return res.status(200).json({
    message: '성공적으로 삭제했습니다..',
  });
});

export default router;
