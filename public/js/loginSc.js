document.getElementById('addUser').addEventListener('click', () => {
  alert('Button clicked!');
});

const openModalBtn = document.getElementById('loginBtn');
const closeModalBtn = document.getElementById('closeModal');
const loginModal = document.getElementById('loginModal');
const overlay = document.getElementById('overlay');
const loginForm = document.getElementById('loginForm');

// 모달 열기
openModalBtn.addEventListener('click', () => {
  loginModal.classList.add('active');
  overlay.classList.add('active');
});

// 모달 닫기
closeModalBtn.addEventListener('click', () => {
  loginModal.classList.remove('active');
  overlay.classList.remove('active');
});

// 배경 클릭 시 모달 닫기
overlay.addEventListener('click', () => {
  loginModal.classList.remove('active');
  overlay.classList.remove('active');
});

// 폼 제출 이벤트
loginForm.addEventListener('submit', (event) => {
  event.preventDefault(); // 기본 폼 제출 방지

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  alert(`Username: ${username}, Password: ${password}`);
  // 여기서 실제 로그인 처리 로직을 추가할 수 있습니다.

  // 모달 닫기
  loginModal.classList.remove('active');
  overlay.classList.remove('active');
});
