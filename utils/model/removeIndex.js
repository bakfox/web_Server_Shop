export default function (array, index) {
  return array.filter((_, i) => i !== index); // 제거해서 보내주기
}
