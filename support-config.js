// 후원 페이지 설정. 계좌 정보를 여기에만 적으면 후원 페이지에 그대로 나옵니다.
// (이 파일은 공개 웹페이지에 올라가므로 누구나 볼 수 있습니다)
window.BLOOD_DUEL_SUPPORT = {
  bank: '카카오뱅크',
  account: '3333-04-7558601',
  holder: '최성*',
  goldPerWon: 1,            // 1원 = 1골드, 5,000원 이상은 1.4배 (5,000원 → 7,000골드)
  renameFrom: 10000,        // 이 금액 이상 후원하면 이름 변경권 1장
  admins: ['W8sKysNV3Whf4WXSzkocqIvYSdg2','56b5mfSkMIfsefIvXC5UEeHyHPp2'] // 운영자 ID: 게임에 '운영자' 버튼이 보임 (실제 권한은 firestore.rules가 정함)
};
