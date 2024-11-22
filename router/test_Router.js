// 순수 테스트 용도 router

import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

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

/** 게시글 상세 조회 API **/
router.get('/posts/:postId', async (req, res, next) => {
  const { postId } = req.params; //findfirst 하나만 찾는용도
  const post = await prisma.posts.findFirst({
    where: { postId: +postId }, // +붙이면 문자열을 숫자열로 변경
    select: {
      postId: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ data: post });
});

export default router;
