import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

//캐릭터 데이터 받아오기( 세부 )
router.get('/character/:userPID', async (req, res, next) => {
  const { userPID } = req.params;

  const character = await prisma.character_Data.findFirst({
    where: { userPID: +userPID },
  });
  if (!character) {
    next();
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
  if (character) {
    next();
  }
  const user = await prisma.character_Data.create({
    data: { userPID },
  });
  return res.status(200).json({
    message: ' 새로운 캐릭터를 등록했습니다. ',
  });
});

//캐릭터 경험치 레벨 저장용.
router.put('/character', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user; //업데이트할 아이템의 ID
  const { characterLevel, characterStatusPoint, characterEXP } = req.body;

  //업데이트할 캐릭터 존재하는지 확인
  const check = await prisma.character_Data.findFirst({
    where: { userPID: +userPID }, //아이템 ID로 검색
  });
  if (!check) {
    next();
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
router.put('/character', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user; //업데이트할 아이템의 ID
  const {
    characterStatusPoint,
    characterATCK,
    characterMACTK,
    characterDEFEND,
  } = req.body;

  //업데이트할 캐릭터 존재하는지 확인
  const check = await prisma.character_Data.findFirst({
    where: { userPID: +userPID }, //아이템 ID로 검색
  });
  if (!check) {
    next();
  }
  // 캐릭터 업데이트
  const character = await prisma.character_Data.update({
    where: { userPID: +userPID },
    data: {
      characterStatusPoint,
      characterATCK,
      characterMACTK,
      characterDEFEND,
    },
  });
  return res.status(200).json({
    message: '캐릭터 성공적으로 업데이트되었습니다.',
  });
});

//골드 획득 //연계 요구
router.put('/getGold', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user; //업데이트할 아이템의 ID
  const { getGold } = req.body;

  //업데이트할 캐릭터 존재하는지 확인
  const check = await prisma.character_Data.findFirst({
    where: { userPID: +userPID }, //아이템 ID로 검색
  });
  if (!check) {
    next();
  }
  // 캐릭터 업데이트
  const character = await prisma.character_Data.update({
    where: { userPID: +userPID },
    data: { characterGold: +(getGold + check.characterGold) },
  });
  return res.status(200).json({
    message: '골드가 증가했습니다.',
  });
});

//골드 소모 //연계 요구
router.put('/lossGold', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user; //업데이트할 아이템의 ID
  const { lossGold } = req.body;

  //업데이트할 캐릭터 존재하는지 확인
  const check = await prisma.character_Data.findFirst({
    where: { userPID: +userPID }, //아이템 ID로 검색
  });
  if (!check) {
    next();
  }
  // 캐릭터 업데이트
  const character = await prisma.character_Data.update({
    where: { userPID: +userPID },
    data: { characterGold: +(lossGold + check.characterGold) },
  });
  return res.status(200).json({
    message: '골드가 감소했습니다.',
  });
});

//삭제용도 // 연결된 inventory도 삭제해야함
router.delete('/deleteCharacter', authMiddleware, async (req, res, next) => {
  const { userPID } = req.user;
  const item = await prisma.item_DataBase.findUnique({
    where: { userPID: +userPID }, //아이템 ID로 검색
  });
  if (!item) {
    next();
  }
  await prisma.item_DataBase.delete({
    where: { userPID: +userPID },
  });
});

export default router;
