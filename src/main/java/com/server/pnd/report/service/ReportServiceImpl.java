package com.server.pnd.report.service;

import com.server.pnd.domain.Repo;
import com.server.pnd.domain.Report;
import com.server.pnd.domain.User;
import com.server.pnd.repo.repository.RepoRepository;
import com.server.pnd.report.dto.CreateReportResponseDto;
import com.server.pnd.report.dto.GitHubEvent;
import com.server.pnd.report.dto.ReportDetailDto;
import com.server.pnd.report.repository.ReportRepository;
import com.server.pnd.s3.config.S3Config;
import com.server.pnd.user.repository.UserRepository;
import com.server.pnd.util.response.CustomApiResponse;
import com.server.pnd.s3.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.ArrayList;


import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import javax.imageio.ImageIO;
import java.util.ArrayList;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService{
    private final RepoRepository repoRepository;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final GitHubGraphQLService gitHubGraphQLService;
    private final S3Service s3Service;
    private final S3Config s3Config;

    // 레포트 생성
    @Override
    public ResponseEntity<CustomApiResponse<?>> createReport(Long repoId) {
        try {
            // 404 : 해당 레포가 없는 경우
            Optional<Repo> foundRepo = repoRepository.findById(repoId);
            if (foundRepo.isEmpty()) {
                CustomApiResponse<?> res = CustomApiResponse.createFailWithoutData(404, "해당 레포를 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(res);
            }
            Repo repo = foundRepo.get();
            Optional<User> foundUser = Optional.ofNullable(repo.getUser());

            // 404 : 해당 유저가 없는 경우
            if (foundUser.isEmpty()) {
                CustomApiResponse<?> res = CustomApiResponse.createFailWithoutData(404, "해당 레포의 유저를 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(res);
            }
            User user = foundUser.get();

            // 엑세스 토큰, URL 설정
            // socialLoginService.refreshGitHubAccessToken(user); // 토큰 업데이트
            String accessToken = user.getAccessToken();
            String username = user.getName();
            String repositoryName = repo.getRepoName();

            // GitHub GraphQL API 사용하여 데이터 가져오기
            String response = gitHubGraphQLService.fetchUserData(accessToken, username, repositoryName);
            System.err.println("response: " + response);

            // 깃허브 레포트 생성 (Node.js 스크립트실행)
            ProcessBuilder processBuilder = new ProcessBuilder("ts-node", "src/main/resources/scripts/3d-contrib/src/index.ts");

            // 환경 변수 설정
            processBuilder.environment().put("GITHUB_DATA", response);
            processBuilder.environment().put("USERNAME", username);

            // 스크립트 실행 및 결과 확인
            System.out.println("Starting Node.js script...");
            Process process = processBuilder.start();

            // 표준 출력 읽기
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;

            List<String> generatedFileNames = new ArrayList<>();

            while ((line = reader.readLine()) != null) {
                System.out.println(line); // 출력된 내용 확인
                if (line.endsWith(".svg")) { // SVG 파일 이름을 포함하는 줄을 찾음
                    generatedFileNames.add(line.trim()); // 파일 이름 저장
                }
            }

            // 프로세스 종료 코드 확인
            int exitCode = process.waitFor();
            System.out.println("Node.js script finished with exit code: " + exitCode);

            if (exitCode != 0) {
                throw new RuntimeException("3D 그래프 생성 중 오류 발생, exit code: " + exitCode);
            }

            String[] imageUrl = new String[7]; // 배포 이미지 url

            if (!generatedFileNames.isEmpty()) {
                System.out.println("Generated SVG files: " + String.join(", ", generatedFileNames));

                String dirName = username + repositoryName;

                int i=0;
                for (String svgFileName : generatedFileNames) {

                    // file 가져오기
                    File file = new File("../profile-3d-contrib/" + svgFileName);

                    // file 이름 설정
                    String fileName = dirName + "/" + file.getName();

                    // S3에 파일 업로드 & 파일(사진) 링크 저장
                    imageUrl[i] = s3Service.upload(file, dirName, fileName);

                    // 생성된 Report에 대한 정보 출력
                    System.out.println("Report created with image URL: " + imageUrl);

                    i++;
                }

                // DB 저장
                Report report = Report.builder()
                        .repo(repo)
                        .imageGreen(imageUrl[0])
                        .imageSeason(imageUrl[1])
                        .imageSouthSeason(imageUrl[2])
                        .imageNightView(imageUrl[3])
                        .imageNightGreen(imageUrl[4])
                        .imageNightRainbow(imageUrl[5])
                        .imageGitblock(imageUrl[6])
                        .build();
                reportRepository.save(report);

                // 201 : 레포트 생성 성공
                CreateReportResponseDto data = CreateReportResponseDto.builder()
                        .repoTitle(repo.getTitle()) // 레포의 제목
                        .image("Uploaded multiple images") // 필요에 따라 첫 번째 이미지를 사용하거나 다중 이미지 정보를 표시할 수 있습니다.
                        .createdAt(reportRepository.findByRepo(repo).get().localDateTimeToString()) // 마지막으로 저장된 Report의 시간 가져오기
                        .build();

                CustomApiResponse<?> res = CustomApiResponse.createSuccess(201, data, "레포트 생성 성공했습니다.");
                return ResponseEntity.status(201).body(res);
            }
            else {
                throw new RuntimeException("SVG 파일 생성 중 오류 발생, 파일 이름을 찾을 수 없음.");
            }

        } catch (IOException e) {
            e.printStackTrace();
            CustomApiResponse<?> res = CustomApiResponse.createFailWithoutData(500, "서버 오류로 인해 레포트를 생성할 수 없습니다.");
            return ResponseEntity.status(500).body(res);
        } catch (InterruptedException e) {
            e.printStackTrace();
            CustomApiResponse<?> res = CustomApiResponse.createFailWithoutData(500, "프로세스 실행 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(res);
        } catch (Exception e) {
            e.printStackTrace();
            CustomApiResponse<?> res = CustomApiResponse.createFailWithoutData(500, "알 수 없는 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(res);
        }
    }

    @Override
    public ResponseEntity<CustomApiResponse<?>> searchDetail(Long repoId) {
        // 해당 레포가 없는 경우 : 404
        Optional<Repo> foundRepo = repoRepository.findById(repoId);
        if (foundRepo.isEmpty()) {
            CustomApiResponse<?> res = CustomApiResponse.createFailWithoutData(404, "해당 레포를 찾을 수 없습니다.");
            return ResponseEntity.status(404).body(res);
        }
        Repo repo = foundRepo.get();

        // 해당 레포의 레포트가 없는 경우 : 404
        Optional<Report> foundReport = reportRepository.findByRepo(repo);
        if (foundReport.isEmpty()) {
            CustomApiResponse<?> res = CustomApiResponse.createFailWithoutData(404, "해당 레포의 레포트가 존재하지 않습니다.");
            return ResponseEntity.status(404).body(res);
        }
        Report report = foundReport.get();

        // data
        ReportDetailDto data = ReportDetailDto.builder()
                .id(report.getId())
                .repoTitle(repo.getTitle())
                .imageGreen(report.getImageGreen())
                .imageSeason(report.getImageSeason())
                .imageSouthSeason(report.getImageSouthSeason())
                .imageNightView(report.getImageNightView())
                .imageNightGreen(report.getImageNightGreen())
                .imageNightRainbow(report.getImageNightRainbow())
                .imageGitblock(report.getImageGitblock())
                .createdAt(report.localDateTimeToString())
                .build();

        // 레포트 상세조회 성공 : 200
        CustomApiResponse<?> res = CustomApiResponse.createSuccess(200, data, "레포트 상세 조회 성공했습니다.");
        return ResponseEntity.status(200).body(res);
    }

    // 깃허브 이벤트 불러오기
    public GitHubEvent[] getEventsFromGithub(String accessToken, String username, String url){
        // 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "token " + accessToken);
        headers.set("Content-type", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        // 요청 보내기 및 응답 받기
        ResponseEntity<GitHubEvent[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, GitHubEvent[].class);
        return response.getBody();  // GitHubEvent 배열 반환
    }

    // report 생성
    public void makeReportImg() {
        // 이미지 생성
        BufferedImage img = new BufferedImage(1416, 726, BufferedImage.TYPE_INT_RGB);
        // Graphics2D를 얻어와 그림을 그림
        Graphics2D graphics = img.createGraphics();
        try{
            // 파일의 이름 설정
            File file = new File("/Users/gimhyejin/Desktop/imgtest.jpg");
            // write메소드를 이용해 파일을 만듦
            ImageIO.write(img, "jpg", file);
        }
        catch(Exception e){e.printStackTrace();}

    }

    // 이미지 반환
    private BufferedImage loadGeneratedImage() {
        try {
            File file = new File("/Users/gimhyejin/Desktop/imgtest.jpg");
            return ImageIO.read(file);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

}