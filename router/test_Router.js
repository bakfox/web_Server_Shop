// 순수 테스트 용도 router

import express from 'express';
import { PrismaClient } from '@prisma/client'; //클라이언트 받아오기

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

const prisma = new PrismaClient({
  // Prisma를 이용해 데이터베이스를 접근할 때, SQL을 출력해줍니다.
  log: ['query', 'info', 'warn', 'error'],
  // 클라이언트 생성
  // 에러 메시지를 평문이 아닌, 개발자가 읽기 쉬운 형태로 출력해줍니다.
  errorFormat: 'pretty',
}); // PrismaClient 인스턴스를 생성합니다.

// 게시글 생성
router.post('/posts', async (req, res, next) => {
  const { title, content, password } = req.body;
  const post = await prisma.posts.create({
    data: {
      title,
      content,
      password,
    },
  });

  return res.status(201).json({ data: post });
});

export default router;
