package com.server.pnd.report.controller;

import com.server.pnd.report.service.ReportService;
import com.server.pnd.util.response.CustomApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/pnd/report")
public class ReportController {
    final private ReportService reportService;

    // 리포트 생성
    @SneakyThrows
    @PostMapping("/{repo_id}")
    public ResponseEntity<CustomApiResponse<?>> createReport(
            @PathVariable("repo_id") Long repoId) {
        return reportService.createReport(repoId);
    }

    // 리포트 상세조회
    @GetMapping("/{repo_id}")
    public ResponseEntity<CustomApiResponse<?>> searchDetail(
            @PathVariable("repo_id") Long repoId){
        return reportService.searchDetail(repoId);
    }

}
