package com.server.pnd.oauth.service;


import com.server.pnd.domain.User;
import com.server.pnd.oauth.dto.TokenDto;
import com.server.pnd.oauth.dto.UserInfo;
import com.server.pnd.util.response.CustomApiResponse;
import org.springframework.http.ResponseEntity;

//소셜로그인 공통 인터페이스
public interface SocialLoginService {
    //접근 토큰 받기
    ResponseEntity<CustomApiResponse<?>> getAccessToken(String code);

    //사용자 정보 받기
    ResponseEntity<CustomApiResponse<?>> getUserInfo(TokenDto tokenDto);

    //로그인/회원가입
    ResponseEntity<CustomApiResponse<?>> login(UserInfo userInfo);

    //레포지토리 정보 가져오지
    ResponseEntity<CustomApiResponse<?>> getUserRepository(TokenDto tokenDto, UserInfo userInfo);

    //refresh token을 이용해 access token update
    void refreshGitHubAccessToken(User user);

}