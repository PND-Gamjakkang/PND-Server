import * as d3 from 'd3';
import * as util from './utils';
import * as type from './type';

const ANGLE = 30; // 3D 효과를 위한 각도 설정 (30도)
const DARKER_RIGHT = 1; // 오른쪽 패널의 색상을 어둡게 만들 비율
const DARKER_LEFT = 0.5; // 왼쪽 패널의 색상을 어둡게 만들 비율
const DARKER_TOP = 0; // 상단 패널의 색상은 어둡게 만들지 않음

// 두 날짜 간의 차이를 일 단위로 계산하는 함수
const diffDate = (beforeDate: number, afterDate: number): number =>
    Math.floor((afterDate - beforeDate) / (24 * 60 * 60 * 1000));

// 주어진 날짜에 따라 두 색상 간의 그라데이션을 생성하는 함수
const createGradation = (
    dayOfMonth: number, // 달의 일자 (1~31)
    color1: string, // 시작 색상
    color2: string // 끝 색상
): string => {
    let ratio; // 색상 비율을 결정하는 변수
    if (dayOfMonth <= 7) {
        ratio = 0.2; // 첫 주
    } else if (dayOfMonth <= 14) {
        ratio = 0.4; // 둘째 주
    } else if (dayOfMonth <= 21) {
        ratio = 0.6; // 셋째 주
    } else if (dayOfMonth <= 28) {
        ratio = 0.8; // 넷째 주
    } else {
        return color2; // 다섯째 주 이후에는 두 번째 색상 반환
    }
    const color = d3.interpolate(color1, color2); // 색상 간의 보간(interpolation)을 통해 그라데이션 생성
    return color(ratio); // 계산된 비율에 따른 색상 반환
};

// 날짜와 계절에 따라 적절한 색상을 결정하는 함수
const decideSeasonColor = (
    contributionLevel: number, // 기여 레벨
    settings: type.SeasonColorSettings, // 계절별 색상 설정
    date: Date // 날짜
): string => {
    const sunday = new Date(date.getTime()); // 해당 주의 일요일로 날짜 설정
    sunday.setDate(sunday.getDate() - sunday.getDay()); // 날짜를 일요일로 변경

    const month = sunday.getUTCMonth(); // 월 (0~11)
    const dayOfMonth = sunday.getUTCDate(); // 해당 월의 일자 (1~31)

    // 월에 따라 계절과 색상을 결정
    switch (month + 1) {
        case 9:
            // 여름 -> 가을
            return createGradation(
                dayOfMonth,
                settings.contribColors2[contributionLevel], // 여름 색상
                settings.contribColors3[contributionLevel] // 가을 색상
            );
        case 10:
        case 11:
            // 가을
            return settings.contribColors3[contributionLevel];
        case 12:
            // 가을 -> 겨울
            return createGradation(
                dayOfMonth,
                settings.contribColors3[contributionLevel],
                settings.contribColors4[contributionLevel] // 겨울 색상
            );
        case 1:
        case 2:
            // 겨울
            return settings.contribColors4[contributionLevel];
        case 3:
            // 겨울 -> 봄
            return createGradation(
                dayOfMonth,
                settings.contribColors4[contributionLevel],
                settings.contribColors1[contributionLevel] // 봄 색상
            );
        case 4:
        case 5:
            // 봄
            return settings.contribColors1[contributionLevel];
        case 6:
            // 봄 -> 여름
            return createGradation(
                dayOfMonth,
                settings.contribColors1[contributionLevel],
                settings.contribColors2[contributionLevel] // 여름 색상
            );
        case 7:
        case 8:
        default:
            // 여름
            return settings.contribColors2[contributionLevel];
    }
};

// 일반적인 색상을 SVG 요소에 적용하는 함수
const addNormalColor = (
    path: d3.Selection<SVGRectElement, unknown, null, unknown>,
    contributionLevel: number, // 기여 레벨
    settings: type.NormalColorSettings, // 일반 색상 설정
    darker: number // 색상 어두운 정도
): void => {
    const color = settings.contribColors[contributionLevel]; // 기여 레벨에 따른 색상 선택
    path.attr('fill', d3.rgb(color).darker(darker).toString()); // 선택된 색상을 패널에 적용
};

// 계절에 따른 색상을 SVG 요소에 적용하는 함수
const addSeasonColor = (
    path: d3.Selection<SVGRectElement, unknown, null, unknown>,
    contributionLevel: number, // 기여 레벨
    settings: type.SeasonColorSettings, // 계절 색상 설정
    darker: number, // 색상 어두운 정도
    date: Date // 날짜
): void => {
    const color = decideSeasonColor(contributionLevel, settings, date); // 날짜에 따른 계절 색상 결정
    path.attr('fill', d3.rgb(color).darker(darker).toString()); // 선택된 색상을 패널에 적용
};

// 무지개 색상을 SVG 요소에 애니메이션으로 적용하는 함수
const addRainbowColor = (
    path: d3.Selection<SVGRectElement, unknown, null, unknown>,
    contributionLevel: number, // 기여 레벨
    settings: type.RainbowColorSettings, // 무지개 색상 설정
    darker: number, // 색상 어두운 정도
    week: number // 주 번호
): void => {
    const offsetHue = week * settings.hueRatio; // 주별로 색상 오프셋 설정
    const saturation = settings.saturation; // 색상 포화도 설정
    const lightness = settings.contribLightness[contributionLevel]; // 기여 레벨에 따른 밝기 설정
    const values = [...Array<undefined>(7)]
        .map((_, i) => (i * 60 + offsetHue) % 360) // 각 요일에 대한 색상 계산
        .map((hue) => `hsl(${hue},${saturation},${lightness})`) // HSL 색상 문자열로 변환
        .map((c) => d3.rgb(c).darker(darker).toString()) // 색상을 어둡게 변환
        .join(';'); // 애니메이션에 사용할 색상 값을 ';'로 연결

    path.append('animate')
        .attr('attributeName', 'fill') // 애니메이션 대상 속성 (fill)
        .attr('values', values) // 애니메이션에서 사용할 색상 값들
        .attr('dur', settings.duration) // 애니메이션 지속 시간
        .attr('repeatCount', 'indefinite'); // 애니메이션 무한 반복
};

// 비트맵 패턴을 SVG 요소에 적용하는 함수
type PanelType = 'top' | 'left' | 'right'; // 패널 타입 정의 (상단, 왼쪽, 오른쪽)

const addBitmapPattern = (
    path: d3.Selection<SVGRectElement, unknown, null, unknown>,
    contributionLevel: number, // 기여 레벨
    panel: PanelType // 패널 타입
): void => {
    path.attr('fill', `url(#pattern_${contributionLevel}_${panel})`); // 패턴을 필로 적용
};

// 각도를 아크탄젠트(atan)로 변환하는 함수 (3D 효과를 위해 사용)
const atan = (value: number) => (Math.atan(value) * 360) / 2 / Math.PI;

// 비트맵 패턴을 정의하는 함수
const addPatternForBitmap = (
    defs: d3.Selection<SVGDefsElement, unknown, null, unknown>,
    panelPattern: type.PanelPattern, // 패널 패턴 정보
    contributionLevel: number, // 기여 레벨
    panel: PanelType, // 패널 타입
    backgroundColor: string, // 배경 색상
    foregroundColor: string // 전경 색상
): void => {
    const width = Math.max(1, panelPattern.width); // 패턴의 너비 설정
    const height = Math.max(1, panelPattern.bitmap.length); // 패턴의 높이 설정
    const pattern = defs
        .append('pattern')
        .attr('id', `pattern_${contributionLevel}_${panel}`) // 패턴 ID 설정
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('patternUnits', 'userSpaceOnUse'); // 패턴 단위 설정
    pattern
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', backgroundColor); // 배경 색상 적용
    const path = d3.path();
    for (const [y, bitmapValue] of panelPattern.bitmap.entries()) {
        const bitmap =
            typeof bitmapValue === 'string'
                ? parseInt(bitmapValue, 16) // 16진수 문자열을 숫자로 변환
                : bitmapValue;
        for (let x = 0; x < width; x++) {
            if ((bitmap & (1 << (width - x - 1))) !== 0) {
                path.rect(x, y, 1, 1); // 비트맵 값에 따라 사각형을 그림
            }
        }
    }
    pattern
        .append('path')
        .attr('stroke', 'none')
        .attr('fill', foregroundColor) // 전경 색상 적용
        .attr('d', path.toString()); // 생성된 경로 데이터를 적용
};

// SVG 요소에 정의(defs)를 추가하는 함수
export const addDefines = (
    svg: d3.Selection<SVGSVGElement, unknown, null, unknown>,
    settings: type.Settings // 설정 정보
): void => {
    if (settings.type === 'bitmap') {
        const defs = svg.append('defs'); // defs 요소 추가

        for (const [contribLevel, info] of settings.contribPatterns.entries()) {
            addPatternForBitmap(
                defs,
                info.top,
                contribLevel,
                'top',
                info.top.backgroundColor,
                info.top.foregroundColor
            );

            addPatternForBitmap(
                defs,
                info.left,
                contribLevel,
                'left',
                info.left.backgroundColor ||
                    d3
                        .rgb(info.top.backgroundColor)
                        .darker(DARKER_LEFT)
                        .toString(),
                info.left.foregroundColor ||
                    d3
                        .rgb(info.top.foregroundColor)
                        .darker(DARKER_LEFT)
                        .toString()
            );

            addPatternForBitmap(
                defs,
                info.right,
                contribLevel,
                'right',
                info.right.backgroundColor ||
                    d3
                        .rgb(info.top.backgroundColor)
                        .darker(DARKER_RIGHT)
                        .toString(),
                info.right.foregroundColor ||
                    d3
                        .rgb(info.top.foregroundColor)
                        .darker(DARKER_RIGHT)
                        .toString()
            );
        }
    }
};

// 3D 기여 그래프를 생성하는 함수 ----------------------------------------------------
export const create3DContrib = (
    svg: d3.Selection<SVGSVGElement, unknown, null, unknown>,
    repositoryInfo: type.RepositoryInfo, // 레포지토리 정보
    x: number, // X 좌표
    y: number, // Y 좌표
    width: number, // 너비
    height: number, // 높이
    settings: type.FullSettings, // 전체 설정
    isForcedAnimation = false // 강제 애니메이션 여부
): void => {
    if (repositoryInfo.contributions.length === 0) {
        return; // 기여 정보가 없으면 함수 종료
    }

    // 최종적으로 생성할 시작 날짜와 종료 날짜를 계산
    const currentDate = new Date();

    // 기여 데이터 중 가장 늦은 날짜를 찾기 위해 초기화
    let lastContributionDate = new Date(repositoryInfo.contributions[0].date);

    // 모든 기여 데이터의 날짜를 비교하여 가장 늦은 날짜를 찾음
    repositoryInfo.contributions.forEach(contribution => {
        const contributionDate = new Date(contribution.date);
        if (contributionDate > lastContributionDate) {
            lastContributionDate = contributionDate;
        }
    });

    // 종료 날짜를 가장 늦은 기여 날짜로 설정하고, 7일 단위로 조정
    let endDate = new Date(lastContributionDate);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // 해당 주의 토요일로 맞춤

    // 시작 날짜를 계산하기 위한 기본 기간 (5개월 전)
    const fiveMonthsAgo = new Date(endDate);
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);

    // 첫 기여 날짜 가져오기
    let firstContributionDate = new Date(repositoryInfo.contributions[0].date);

    // 모든 기여 데이터의 날짜를 비교하여 가장 이른 날짜를 찾음
    repositoryInfo.contributions.forEach(contribution => {
        const contributionDate = new Date(contribution.date);
        if (contributionDate < firstContributionDate) {
            firstContributionDate = contributionDate;
        }
    });

    // 첫 기여 날짜와 종료 날짜 간의 차이를 계산
    const dateDifference = diffDate(firstContributionDate.getTime(), endDate.getTime());

    // 시작 날짜를 계산
    let startDate;
    if (dateDifference < 5 * 30) { // 5개월 미만일 경우
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 5);
    } else if (dateDifference >= 5 * 30 && dateDifference < 12 * 30) { // 5개월 이상 1년 미만일 경우
        startDate = new Date(firstContributionDate);
    } else { // 1년 이상일 경우
        startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // 시작 날짜를 7일 단위로 조정
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // 기본 블록 날짜 배열 생성
    const allDates: Date[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        allDates.push(new Date(d.getTime())); // Date 객체를 복사하여 배열에 추가
    }

    // 모든 날짜에 대해 기본 블럭 설정
    const fullYearData = allDates.map(date => ({
        date: date,
        contributionCount: 0,
        contributionLevel: 0,
    }));

    // 실제 기여 데이터를 병합 (기여 데이터가 기본 잔디 블록 범위 내에 포함됨)
    repositoryInfo.contributions.forEach(cal => {
        const dateKey = cal.date.toISOString().split('T')[0]; // 날짜만 추출하여 키로 사용
        const existing = fullYearData.find(entry => entry.date.toISOString().split('T')[0] === dateKey);
        if (existing) {
            existing.contributionCount += cal.contributionCount;
            existing.contributionLevel = Math.max(existing.contributionLevel, cal.contributionLevel);
        }
    });

    // fullYearData를 그대로 사용
    const contributionsArray = fullYearData;


    // 날짜 순으로 정렬
    contributionsArray.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 기여 시작 시간을 가져옴
    const startTime = contributionsArray[0].date.getTime(); 
    // const startTime = repositoryInfo.contributions[0].date.getTime(); // 기여 시작 시간을 가져옴

    const dx = width / 64; // 주간 칸 너비 계산(64)
    const dy = dx * Math.tan(ANGLE * ((2 * Math.PI) / 360)); // 주간 칸 높이 계산 (3D 효과를 위해 각도 적용)
    const weekcount = Math.ceil(contributionsArray.length / 7.0); // 총 주 수 계산
    // const weekcount = Math.ceil(repositoryInfo.contributions.length / 7.0); // 총 주 수 계산
    
    // 주석
    // console.log("repositoryInfo.contributions" , repositoryInfo.contributions);

    const dxx = dx * 0.9; // 칸 너비에 0.9 비율 적용
    const dyy = dy * 0.9; // 칸 높이에 0.9 비율 적용

    // 전체 기여 그래프의 너비와 높이 계산
    const graphWidth = dx * 7; // 한 주에 7일이므로 7개의 블록
    const graphHeight = weekcount * dy; // 전체 주 수에 따른 높이 계산


    // 중앙에서 살짝 왼쪽 아래로 이동시키기 위해 X, Y 오프셋 계산 (비율 기반) -> 5개월~1년 모두 괜찮은 위치인지 확인 필요
    const offsetX = (width - graphWidth) / 2 - graphWidth * 1.5; // X 좌표를 그래프 너비의 10%만큼 왼쪽으로 이동
    const offsetY = (height - graphHeight) / 2 + graphHeight * 0.1; // Y 좌표를 그래프 높이의 10%만큼 아래로 이동


    const group = svg.append('g'); // 새로운 그룹 요소 추가

    contributionsArray.forEach((cal) => {
        const dayOfWeek = cal.date.getUTCDay(); // 기여 날짜의 요일 가져오기 (일요일 = 0)
        const week = Math.floor(diffDate(startTime, cal.date.getTime()) / 7); // 해당 기여가 속한 주 계산
        
        // 확인을 위한 로그
        // console.log(`startTime : ${startTime}, cal.date.getTime() : ${cal.date.getTime()}`);
        
        const baseX = offsetX + (week - dayOfWeek) * dx; // 기여의 X 좌표 계산
        const baseY = offsetY + (week + dayOfWeek) * dy; // 기여의 Y 좌표 계산

        // 로그 추가: 각 블록의 위치와 관련된 값들을 출력
        // console.log(`Date: ${cal.date}, DayOfWeek: ${dayOfWeek}, Week: ${week}`);
        // console.log(`BaseX: ${baseX}, BaseY: ${baseY}`);

        const calHeight = Math.log10(cal.contributionCount / 20 + 1) * 144 + 3; // 기여 수에 따른 칸 높이 계산
        const contribLevel = cal.contributionLevel; // 기여 레벨 가져오기

        const isAnimate = settings.growingAnimation || isForcedAnimation; // 애니메이션 여부 결정

        const bar = group
            .append('g')
            .attr(
                'transform',
                `translate(${util.toFixed(baseX)} ${util.toFixed(
                    baseY - calHeight
                )})`
            ); // 기여 그래프의 위치 설정
        if (isAnimate && contribLevel !== 0) {
            bar.append('animateTransform')
                .attr('attributeName', 'transform')
                .attr('type', 'translate')
                .attr(
                    'values',
                    `${util.toFixed(baseX)} ${util.toFixed(
                        baseY - 3
                    )};${util.toFixed(baseX)} ${util.toFixed(
                        baseY - calHeight
                    )}`
                ) // 애니메이션을 위한 위치 변환 설정
                .attr('dur', '3s') // 애니메이션 지속 시간
                .attr('repeatCount', '1'); // 애니메이션 반복 횟수 (한 번만 실행)
        }

        const widthTop =
            settings.type === 'bitmap'
                ? Math.max(1, settings.contribPatterns[contribLevel].top.width) // 비트맵 패턴의 너비 계산
                : dxx;
        const topPanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(widthTop)) // 상단 패널의 너비 설정
            .attr('height', util.toFixed(widthTop)) // 상단 패널의 높이 설정
            .attr(
                'transform',
                `skewY(${-ANGLE}) skewX(${util.toFixed(
                    atan(dxx / 2 / dyy)
                )}) scale(${util.toFixed(dxx / widthTop)} ${util.toFixed(
                    (2 * dyy) / widthTop
                )})`
            ); // 3D 효과를 위한 변환 적용

        // 패널에 색상 적용
        if (settings.type === 'normal') {
            addNormalColor(topPanel, contribLevel, settings, DARKER_TOP); // 일반 색상 적용
        } else if (settings.type === 'season') {
            addSeasonColor(
                topPanel,
                contribLevel,
                settings,
                DARKER_TOP,
                cal.date
            ); // 계절 색상 적용
        } else if (settings.type === 'rainbow') {
            addRainbowColor(topPanel, contribLevel, settings, DARKER_TOP, week); // 무지개 색상 적용
        } else if (settings.type === 'bitmap') {
            addBitmapPattern(topPanel, contribLevel, 'top'); // 비트맵 패턴 적용
        }

        const widthLeft =
            settings.type === 'bitmap'
                ? Math.max(1, settings.contribPatterns[contribLevel].left.width) // 왼쪽 패널 너비 계산
                : dxx;
        const scaleLeft = Math.sqrt(dxx ** 2 + dyy ** 2) / widthLeft; // 왼쪽 패널 스케일 계산
        const heightLeft = calHeight / scaleLeft; // 왼쪽 패널 높이 계산
        const leftPanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(widthLeft))
            .attr('height', util.toFixed(heightLeft))
            .attr(
                'transform',
                `skewY(${ANGLE}) scale(${util.toFixed(
                    dxx / widthLeft
                )} ${util.toFixed(scaleLeft)})`
            ); // 왼쪽 패널 변환 적용

        // 왼쪽 패널에 색상 적용
        if (settings.type === 'normal') {
            addNormalColor(leftPanel, contribLevel, settings, DARKER_LEFT);
        } else if (settings.type === 'season') {
            addSeasonColor(
                leftPanel,
                contribLevel,
                settings,
                DARKER_LEFT,
                cal.date
            );
        } else if (settings.type === 'rainbow') {
            addRainbowColor(
                leftPanel,
                contribLevel,
                settings,
                DARKER_LEFT,
                week
            );
        } else if (settings.type === 'bitmap') {
            addBitmapPattern(leftPanel, contribLevel, 'left');
        }
        if (isAnimate && contribLevel !== 0) {
            leftPanel
                .append('animate')
                .attr('attributeName', 'height')
                .attr(
                    'values',
                    `${util.toFixed(3 / scaleLeft)};${util.toFixed(heightLeft)}`
                )
                .attr('dur', '3s')
                .attr('repeatCount', '1'); // 애니메이션 설정
        }

        const widthRight =
            settings.type === 'bitmap'
                ? Math.max(
                      1,
                      settings.contribPatterns[contribLevel].right.width
                  ) // 오른쪽 패널 너비 계산
                : dxx;
        const scaleRight = Math.sqrt(dxx ** 2 + dyy ** 2) / widthRight; // 오른쪽 패널 스케일 계산
        const heightRight = calHeight / scaleRight; // 오른쪽 패널 높이 계산
        const rightPanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(widthRight))
            .attr('height', util.toFixed(heightRight))
            .attr(
                'transform',
                `translate(${util.toFixed(dxx)} ${util.toFixed(
                    dyy
                )}) skewY(${-ANGLE}) scale(${util.toFixed(
                    dxx / widthRight
                )} ${util.toFixed(scaleRight)})`
            ); // 오른쪽 패널 변환 적용

        // 오른쪽 패널에 색상 적용
        if (settings.type === 'normal') {
            addNormalColor(rightPanel, contribLevel, settings, DARKER_RIGHT);
        } else if (settings.type === 'season') {
            addSeasonColor(
                rightPanel,
                contribLevel,
                settings,
                DARKER_RIGHT,
                cal.date
            );
        } else if (settings.type === 'rainbow') {
            addRainbowColor(
                rightPanel,
                contribLevel,
                settings,
                DARKER_RIGHT,
                week
            );
        } else if (settings.type === 'bitmap') {
            addBitmapPattern(rightPanel, contribLevel, 'right');
        }
        if (isAnimate && contribLevel !== 0) {
            rightPanel
                .append('animate')
                .attr('attributeName', 'height')
                .attr(
                    'values',
                    `${util.toFixed(3 / scaleRight)};${util.toFixed(
                        heightRight
                    )}`
                )
                .attr('dur', '3s')
                .attr('repeatCount', '1'); // 애니메이션 설정
        }
    });
};
