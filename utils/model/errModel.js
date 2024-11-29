export default (status, message) => {
  const err = new Error(message || 'equipInventory가 없습니다.');
  err.status = status;
  return err;
};
