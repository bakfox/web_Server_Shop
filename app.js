import express from 'express';
import loginRouter from './router/login_Router.js';
import errorMiddleware from './middlewares/error.middleware.js';

let login_Session = {}; // 로그인 세션

const app = express();
const PORT = 3017;

app.use(express.json());
app.use('/api', [loginRouter]);
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
