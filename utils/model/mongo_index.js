import mongoose from 'mongoose';

const connect_mongo = () => {
  mongoose
    .connect(
      'mongodb+srv://bacfox:tkddn0023_23_tk@express-mongo.8o23c.mongodb.net/?retryWrites=true&w=majority&appName=express-mongo',
      {
        dbName: 'apap',
      },
    )
    .catch((err) => console.log(err))
    .then(() => console.log(' 몽고 연결 성공 '));
};

mongoose.connection.on('error', (err) => {
  console.error(' 몽고 에러 발생 자세히 : ', err);
});

export default connect_mongo;
