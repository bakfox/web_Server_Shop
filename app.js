import express from 'express';

import loginRouter from './router/login_Router.js';
//import auctionRouter from './router/auction_Router.js';
import itemDataBaseRouter from './router/itemData_Router.js';
import characterRouter from './router/character_Router.js';
import inventoryRouter from './router/inventory_Router.js';

import errorMiddleware from './middlewares/error.middleware.js';

const app = express();
const PORT = 3017;

app.use(express.json()); //json 타입
app.use(express.urlencoded({ extended: true })); //바디 파서
app.use('/api', [
  loginRouter,
  //auctionRouter,
  itemDataBaseRouter,
  characterRouter,
  inventoryRouter,
]); //메인 라우터들

app.use(errorMiddleware); //에러 미들웨어

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
