package com.server.pnd.project.service;

import com.server.pnd.domain.Project;
import com.server.pnd.domain.Repository;
import com.server.pnd.domain.User;
import com.server.pnd.project.dto.ProjectCreatedDto;
import com.server.pnd.project.repository.ProjectRepository;
import com.server.pnd.repository.repository.RepositoryRepository;
import com.server.pnd.util.jwt.JwtUtil;
import com.server.pnd.util.response.CustomApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService{
    private final JwtUtil jwtUtil;
    private final RepositoryRepository repositoryRepository;
    private final ProjectRepository projectRepository;

    @Override
    public ResponseEntity<CustomApiResponse<?>> createProject(String authorizationHeader, ProjectCreatedDto projectCreatedDto) {
        Optional<User> foundUser = jwtUtil.findUserByJwtToken(authorizationHeader);
        // 토큰에 해당하는 유저가 없는 경우 : 404
        if (foundUser.isEmpty()) {
            CustomApiResponse<?> res = CustomApiResponse.createFailWithoutData(404, "유효하지 않은 토큰이거나, 해당 ID에 해당하는 사용자가 존재하지 않습니다.");
            return ResponseEntity.status(404).body(res);
        }
        User user = foundUser.get();

        Optional<Repository> foundRepository = repositoryRepository.findById(projectCreatedDto.getRepositoryId());
        // 해당 Id에 해당하는 레포가 없는 경우 : 404
        if (foundRepository.isEmpty()) {
            CustomApiResponse<?> res = CustomApiResponse.createFailWithoutData(404, "해당 ID를 가진 레포지토리가 존재하지 않습니다.");
            return ResponseEntity.status(404).body(res);
        }
        Repository repository = foundRepository.get();

        // 프로젝트 생성
        Project project = Project.builder()
                .repository(repository)
                .period(projectCreatedDto.getPeriod())
                .image(projectCreatedDto.getImage())
                .part(projectCreatedDto.getPart())
                .build();
        // 저장
        projectRepository.save(project);

        // data
        ProjectCreatedDto data = ProjectCreatedDto.builder()
                .projectId(project.getId())
                .repositoryId(project.getRepository().getId())
                .period(project.getPeriod())
                .image(project.getImage())
                .part(project.getPart())
                .build();
        // 프로젝트 생성 성공 : 201
        CustomApiResponse<?> res = CustomApiResponse.createSuccess(201, data, "프로젝트 생성 완료했습니다.");
        return ResponseEntity.status(201).body(res);
    }
}
