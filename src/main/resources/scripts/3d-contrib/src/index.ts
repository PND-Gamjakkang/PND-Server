import * as client from './github-graphql';
import * as type from './type';
import * as core from '@actions/core';
import * as aggregateRepo from './aggregate-repo-info';
import * as template from './color-template';
import * as create from './create-svg';
import * as f from './file-writer';
import * as r from './settings-reader';

const OTHER_COLOR = '#444444'; // 기본 색상 설정, 언어 색상이 없는 경우 사용

const toNumberContributionLevel = (level: type.ContributionLevel): number => {
    switch (level) {
        case 'NONE': return 0;
        case 'FIRST_QUARTILE': return 1;
        case 'SECOND_QUARTILE': return 2;
        case 'THIRD_QUARTILE': return 3;
        case 'FOURTH_QUARTILE': return 4;
    }
};

const compare = (num1: number, num2: number): number => {
    return num1 - num2; // 비교 결과 반환 (오름차순 정렬)
};

// main 함수
const main = async () => {
    try {
        // const githubData = process.env.GITHUB_DATA;
//         테스트 용도
        const githubData = `{"data":{"repository":{"name":"Scapture-Server","forkCount":0,"stargazerCount":0,"primaryLanguage":{"name":"Java","color":"#b07219"},"defaultBranchRef":{"name":"main","target":{"history":{"edges":[{"node":{"committedDate":"2024-08-06T05:48:00Z","additions":221,"deletions":290,"changedFiles":4,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-06T05:44:22Z","additions":85,"deletions":97,"changedFiles":4,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-06T05:33:50Z","additions":24,"deletions":17,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-06T05:29:21Z","additions":18,"deletions":26,"changedFiles":2,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-06T05:21:34Z","additions":27,"deletions":39,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-06T05:20:05Z","additions":24,"deletions":40,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-06T05:10:28Z","additions":59,"deletions":0,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-06T05:08:54Z","additions":28,"deletions":115,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-06T04:12:30Z","additions":2,"deletions":1,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-06T04:10:06Z","additions":2,"deletions":1,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-05T14:38:33Z","additions":5,"deletions":1,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-08-03T14:11:06Z","additions":99,"deletions":4,"changedFiles":7,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-08-03T14:07:43Z","additions":44,"deletions":6,"changedFiles":3,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-08-03T13:51:57Z","additions":5,"deletions":0,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-08-03T13:50:56Z","additions":48,"deletions":0,"changedFiles":3,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-08-03T13:47:31Z","additions":4,"deletions":0,"changedFiles":1,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-08-02T07:52:32Z","additions":43,"deletions":61,"changedFiles":3,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-02T07:36:49Z","additions":43,"deletions":61,"changedFiles":3,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-08-02T04:59:37Z","additions":9,"deletions":1,"changedFiles":1,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-08-02T04:46:56Z","additions":9,"deletions":1,"changedFiles":1,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-08-02T04:18:19Z","additions":102,"deletions":66,"changedFiles":3,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-08-02T04:13:28Z","additions":86,"deletions":54,"changedFiles":1,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-08-02T02:36:57Z","additions":16,"deletions":12,"changedFiles":3,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-31T04:10:27Z","additions":2,"deletions":0,"changedFiles":2,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-31T02:40:15Z","additions":1,"deletions":1,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-31T02:38:05Z","additions":1,"deletions":1,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-31T02:22:48Z","additions":16,"deletions":2,"changedFiles":2,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-31T02:20:49Z","additions":16,"deletions":2,"changedFiles":2,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-30T12:26:20Z","additions":25,"deletions":2,"changedFiles":3,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-30T11:53:29Z","additions":16,"deletions":8,"changedFiles":2,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-30T11:38:51Z","additions":4,"deletions":2,"changedFiles":2,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-29T12:38:52Z","additions":0,"deletions":2,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-29T12:12:53Z","additions":0,"deletions":2,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-29T10:41:48Z","additions":2,"deletions":1,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-29T10:39:20Z","additions":2,"deletions":1,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-29T10:07:30Z","additions":3,"deletions":1,"changedFiles":1,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-29T09:55:27Z","additions":2,"deletions":0,"changedFiles":2,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-29T09:53:41Z","additions":2,"deletions":0,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-29T03:51:37Z","additions":44,"deletions":33,"changedFiles":4,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-29T03:48:54Z","additions":44,"deletions":33,"changedFiles":4,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-28T15:23:21Z","additions":7,"deletions":12,"changedFiles":2,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-28T15:19:50Z","additions":7,"deletions":12,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-28T15:07:51Z","additions":5,"deletions":12,"changedFiles":2,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-28T15:06:01Z","additions":1,"deletions":1,"changedFiles":1,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-28T15:02:08Z","additions":4,"deletions":11,"changedFiles":1,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-28T10:21:53Z","additions":1,"deletions":0,"changedFiles":1,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-28T10:20:33Z","additions":2,"deletions":2,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-27T18:54:40Z","additions":1,"deletions":1,"changedFiles":1,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-27T18:52:11Z","additions":0,"deletions":1187,"changedFiles":36,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-27T11:35:30Z","additions":13,"deletions":7,"changedFiles":2,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-27T11:30:33Z","additions":13,"deletions":7,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-27T11:25:03Z","additions":3,"deletions":1,"changedFiles":2,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-27T11:22:54Z","additions":3,"deletions":1,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-27T11:20:11Z","additions":2,"deletions":0,"changedFiles":2,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-27T11:18:38Z","additions":2,"deletions":0,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-27T11:16:23Z","additions":1,"deletions":0,"changedFiles":1,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-27T11:14:28Z","additions":1,"deletions":0,"changedFiles":1,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-27T11:13:23Z","additions":38,"deletions":5,"changedFiles":4,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-27T11:11:56Z","additions":9,"deletions":6,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-27T11:04:44Z","additions":1,"deletions":0,"changedFiles":1,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-27T11:04:01Z","additions":12,"deletions":2,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-27T11:01:17Z","additions":19,"deletions":0,"changedFiles":2,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-26T22:08:56Z","additions":117,"deletions":36,"changedFiles":8,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T21:36:00Z","additions":27,"deletions":24,"changedFiles":4,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T21:01:39Z","additions":15,"deletions":7,"changedFiles":3,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T20:42:34Z","additions":33,"deletions":7,"changedFiles":5,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T20:25:20Z","additions":32,"deletions":7,"changedFiles":4,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T20:17:22Z","additions":51,"deletions":32,"changedFiles":6,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T19:36:36Z","additions":1,"deletions":1,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T19:28:23Z","additions":1,"deletions":1,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T19:05:38Z","additions":116,"deletions":9,"changedFiles":6,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T18:57:19Z","additions":15,"deletions":2,"changedFiles":2,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T18:45:40Z","additions":64,"deletions":11,"changedFiles":4,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T18:09:58Z","additions":3,"deletions":1,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T18:07:45Z","additions":14,"deletions":2,"changedFiles":2,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T17:58:48Z","additions":11,"deletions":0,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T17:52:20Z","additions":18,"deletions":2,"changedFiles":3,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T17:38:24Z","additions":1,"deletions":0,"changedFiles":1,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-26T17:26:26Z","additions":20,"deletions":8,"changedFiles":3,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-26T17:25:09Z","additions":20,"deletions":8,"changedFiles":3,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-26T17:04:25Z","additions":97,"deletions":1,"changedFiles":6,"author":{"name":"Hyun seung Lee"}}},{"node":{"committedDate":"2024-07-26T16:59:58Z","additions":89,"deletions":3,"changedFiles":5,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-26T16:42:58Z","additions":10,"deletions":0,"changedFiles":3,"author":{"name":"이현승"}}},{"node":{"committedDate":"2024-07-26T16:06:13Z","additions":74,"deletions":23,"changedFiles":4,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T15:53:51Z","additions":71,"deletions":35,"changedFiles":3,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T15:17:27Z","additions":17,"deletions":2,"changedFiles":2,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T14:58:02Z","additions":79,"deletions":2,"changedFiles":4,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T14:51:16Z","additions":47,"deletions":6,"changedFiles":3,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T14:15:51Z","additions":16,"deletions":0,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T09:17:15Z","additions":20,"deletions":0,"changedFiles":3,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T09:06:25Z","additions":4,"deletions":0,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T09:05:25Z","additions":4,"deletions":0,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T08:58:20Z","additions":44,"deletions":0,"changedFiles":3,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T08:53:56Z","additions":44,"deletions":0,"changedFiles":3,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T07:04:33Z","additions":86,"deletions":0,"changedFiles":4,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T07:01:16Z","additions":33,"deletions":2,"changedFiles":2,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T06:34:55Z","additions":24,"deletions":0,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T06:32:15Z","additions":31,"deletions":0,"changedFiles":4,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-26T05:57:13Z","additions":4,"deletions":2,"changedFiles":1,"author":{"name":"김혜진"}}},{"node":{"committedDate":"2024-07-25T17:52:01Z","additions":4,"deletions":2,"changedFiles":1,"author":{"name":"김혜진"}}}]}}},"languages":{"edges":[{"node":{"name":"Java","color":"#b07219"},"size":186035}]}}}}
`;

        if (!githubData) {
            throw new Error("GITHUB_DATA 환경 변수가 설정되지 않았습니다.");
        }

        // JSON 데이터를 파싱
        const parsedData = JSON.parse(githubData);

        // console.log("ParsedData:", JSON.stringify(parsedData, null, 2));

        // 단일 레포지토리에 대한 정보 집계
        const repoInfo = aggregateRepo.aggregateRepositoryInfo(parsedData);
        // console.log('Aggregated Repository Info:', repoInfo); // 집계된 레포지토리 정보 출력

        if (process.env.SETTING_JSON) {
            const settingFile = r.readSettingJson(process.env.SETTING_JSON);
            const settingInfos =
                'length' in settingFile ? settingFile : [settingFile];
            for (const settingInfo of settingInfos) {
                const fileName =
                    settingInfo.fileName || `profile-${repoInfo.name}-customize.svg`;
                f.writeFile(
                    fileName,
                    create.createSvg(repoInfo, settingInfo, false)
                );
            }
        } else {
            const settings = repoInfo.name.includes("Halloween")
                ? template.HalloweenSettings
                : template.NormalSettings;

            f.writeFile(
                `profile-${repoInfo.name}-green-animate.svg`,
                create.createSvg(repoInfo, settings, true)
            );
            f.writeFile(
                `profile-${repoInfo.name}-green.svg`,
                create.createSvg(repoInfo, settings, false)
            );

            // Northern hemisphere
            f.writeFile(
                `profile-${repoInfo.name}-season-animate.svg`,
                create.createSvg(repoInfo, template.NorthSeasonSettings, true)
            );
            f.writeFile(
                `profile-${repoInfo.name}-season.svg`,
                create.createSvg(repoInfo, template.NorthSeasonSettings, false)
            );

            // Southern hemisphere
            f.writeFile(
                `profile-${repoInfo.name}-south-season-animate.svg`,
                create.createSvg(repoInfo, template.SouthSeasonSettings, true)
            );
            f.writeFile(
                `profile-${repoInfo.name}-south-season.svg`,
                create.createSvg(repoInfo, template.SouthSeasonSettings, false)
            );

            f.writeFile(
                `profile-${repoInfo.name}-night-view.svg`,
                create.createSvg(repoInfo, template.NightViewSettings, true)
            );

            f.writeFile(
                `profile-${repoInfo.name}-night-green.svg`,
                create.createSvg(repoInfo, template.NightGreenSettings, true)
            );

            f.writeFile(
                `profile-${repoInfo.name}-night-rainbow.svg`,
                create.createSvg(repoInfo, template.NightRainbowSettings, true)
            );

            f.writeFile(
                `profile-${repoInfo.name}-gitblock.svg`,
                create.createSvg(repoInfo, template.GitBlockSettings, true)
            );
        }

    } catch (error) {
        console.error('Error:', error);
    }
};

main(); // main 함수 실행
