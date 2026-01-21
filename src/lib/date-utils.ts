import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import 'dayjs/locale/en';
import 'dayjs/locale/ja';
import 'dayjs/locale/zh-cn';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// localizedFormat 플러그인 활성화
dayjs.extend(localizedFormat);

/**
 * 브라우저의 언어 설정에 따라 날짜를 포맷팅합니다.
 * 클라이언트 컴포넌트에서만 사용 가능합니다.
 * @param date 날짜 문자열 또는 Date 객체
 * @param format 포맷 문자열 (기본값: 'LL') - dayjs의 localizedFormat 사용
 * @returns 포맷된 날짜 문자열
 */
export function formatDateByLocale(date: string | Date, format: string = 'LL'): string {
  // 브라우저 환경에서만 navigator 사용 가능
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 기본값으로 한국어 사용
    return dayjs(date).locale('ko').format(format);
  }

  // 브라우저의 언어 설정 가져오기
  const browserLocale = navigator.language || navigator.languages?.[0] || 'ko';

  // locale을 dayjs 형식으로 변환
  const localeParts = browserLocale.toLowerCase().split('-');
  const language = localeParts[0];
  // const region = localeParts[1];

  // 지원하는 locale 매핑
  let dayjsLocale = 'ko'; // 기본값

  if (language === 'ko') {
    dayjsLocale = 'ko';
  } else if (language === 'en') {
    dayjsLocale = 'en';
  } else if (language === 'ja') {
    dayjsLocale = 'ja';
  } else if (language === 'zh') {
    // 중국어는 기본적으로 zh-cn 사용
    dayjsLocale = 'zh-cn';
  }

  return dayjs(date).locale(dayjsLocale).format(format);
}

/**
 * 게시글 날짜 포맷팅 (년 월 일 형식)
 * @param date 날짜 문자열 또는 Date 객체
 * @returns 포맷된 날짜 문자열 (예: "2024년 1월 15일" 또는 "Jan 15, 2024")
 */
export function formatPostDate(date: string | Date): string {
  return formatDateByLocale(date, 'LL');
}
