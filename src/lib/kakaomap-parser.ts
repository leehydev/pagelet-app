/**
 * 카카오맵 퍼가기 HTML 파서
 * 카카오맵에서 제공하는 "지도 퍼가기" HTML 코드에서 파라미터를 추출합니다.
 */

export interface KakaoMapParams {
  timestamp: string;
  key: string;
  mapWidth: number;
  mapHeight: number;
}

/**
 * 카카오맵 퍼가기 HTML에서 파라미터 추출
 * @param html 카카오맵 퍼가기 HTML
 * @returns 파싱된 파라미터 또는 null (파싱 실패 시)
 */
export function parseKakaoMapHtml(html: string): KakaoMapParams | null {
  if (!html || typeof html !== 'string') {
    return null;
  }

  try {
    // new daum.roughmap.Lander({...}).render() 패턴에서 JSON 추출
    // 정규식으로 Lander 객체 파라미터 추출
    const landerPattern = /new\s+daum\.roughmap\.Lander\s*\(\s*(\{[\s\S]*?\})\s*\)/;
    const match = html.match(landerPattern);

    if (!match || !match[1]) {
      return null;
    }

    // JSON 파싱을 위해 따옴표 정규화
    let jsonStr = match[1];
    // 작은따옴표를 큰따옴표로 변환
    jsonStr = jsonStr.replace(/'/g, '"');
    // 키에 따옴표가 없는 경우 처리
    jsonStr = jsonStr.replace(/(\w+)\s*:/g, '"$1":');
    // 이미 따옴표가 있는 키의 이중 따옴표 제거
    jsonStr = jsonStr.replace(/""(\w+)""/g, '"$1"');

    const params = JSON.parse(jsonStr);

    // 필수 필드 검증
    if (!params.timestamp || !params.key) {
      return null;
    }

    return {
      timestamp: String(params.timestamp),
      key: String(params.key),
      mapWidth: parseInt(params.mapWidth, 10) || 640,
      mapHeight: parseInt(params.mapHeight, 10) || 360,
    };
  } catch {
    return null;
  }
}

/**
 * 유효한 카카오맵 HTML인지 검증
 * @param html 검증할 HTML
 * @returns 유효 여부
 */
export function isValidKakaoMapHtml(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }

  // roughmapLoader.js 스크립트 포함 확인
  const hasLoader = html.includes('roughmapLoader.js');

  // daum.roughmap.Lander 호출 확인
  const hasLander = /daum\.roughmap\.Lander/.test(html);

  return hasLoader && hasLander;
}
