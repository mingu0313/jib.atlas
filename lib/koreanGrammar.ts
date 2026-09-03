/**
 * 한글 조사/어미 처리 유틸. 원래 lib/explain.ts 안에 있던 헬퍼들을
 * STEP 8(lib/interiorMatching.ts)에서도 그대로 써야 해서 이 파일로 뽑아냈다.
 * 로직은 옮기기 전과 동일 — explain.ts는 이 파일을 import해서 쓴다.
 */

const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;

/** 문자열 마지막 글자에 받침이 있는지. 한글 음절이 아니면(로마자 등) false. */
function hasBatchim(text: string): boolean {
  const lastChar = text.charCodeAt(text.length - 1);
  if (lastChar < HANGUL_SYLLABLE_START || lastChar > HANGUL_SYLLABLE_END) {
    return false;
  }
  return (lastChar - HANGUL_SYLLABLE_START) % 28 !== 0;
}

/** 받침 유무에 따른 주격 조사 "이"/"가". */
export function subjectParticle(text: string): "이" | "가" {
  return hasBatchim(text) ? "이" : "가";
}

/** 받침 유무에 따른 접속 조사 "과"/"와". */
export function conjunctionParticle(text: string): "과" | "와" {
  return hasBatchim(text) ? "과" : "와";
}

/**
 * trait-descriptions.json류 문구는 전부 관형사형 어미 "-는"으로 끝난다
 * (예: "사람들과 어울리는 시간을 즐기는"). 이 어미는 동사 어간에 붙는 어미라
 * 마지막 글자 "는"을 "고"로 바꾸면 그대로 연결형("-고")이 된다
 * (예: "즐기는" → "즐기고"). 나열 중 마지막 문구가 아닐 때 이 변환을 쓴다.
 */
export function toConnectiveForm(description: string): string {
  return `${description.slice(0, -1)}고`;
}
