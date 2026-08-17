package com.svvape.admin;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

import com.svvape.member.PasswordHasher;

import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AdminAuthService {

	private final Environment environment;
	private final PasswordHasher passwordHasher;

	public AdminAuthService(Environment environment, PasswordHasher passwordHasher) {
		this.environment = environment;
		this.passwordHasher = passwordHasher;
	}

	public void requireAuthorized(String authorizationHeader) {
		String configuredUsername = readSetting("ADMIN_USERNAME");
		String configuredPassword = readSetting("ADMIN_PASSWORD");
		String configuredPasswordHash = readSetting("ADMIN_PASSWORD_HASH");

		if (configuredUsername.isBlank() || (configuredPassword.isBlank() && configuredPasswordHash.isBlank())) {
			throw new AdminAuthenticationException(HttpStatus.SERVICE_UNAVAILABLE, "관리자 로그인이 아직 설정되지 않았습니다.");
		}

		BasicCredential credential = parseBasicCredential(authorizationHeader);
		boolean usernameMatches = secureEquals(configuredUsername, credential.username());
		boolean passwordMatches = configuredPasswordHash.isBlank()
				? secureEquals(configuredPassword, credential.password())
				: passwordHasher.matches(credential.password(), configuredPasswordHash);

		if (!usernameMatches || !passwordMatches) {
			throw new AdminAuthenticationException(HttpStatus.UNAUTHORIZED, "관리자 계정 정보를 확인해 주세요.");
		}
	}

	private BasicCredential parseBasicCredential(String authorizationHeader) {
		if (authorizationHeader == null || !authorizationHeader.regionMatches(true, 0, "Basic ", 0, 6)) {
			throw new AdminAuthenticationException(HttpStatus.UNAUTHORIZED, "관리자 로그인이 필요합니다.");
		}

		try {
			String token = authorizationHeader.substring(6).trim();
			String decoded = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);
			int separator = decoded.indexOf(':');
			if (separator <= 0) {
				throw new IllegalArgumentException("Missing separator");
			}
			return new BasicCredential(decoded.substring(0, separator), decoded.substring(separator + 1));
		}
		catch (IllegalArgumentException exception) {
			throw new AdminAuthenticationException(HttpStatus.UNAUTHORIZED, "관리자 로그인이 필요합니다.");
		}
	}

	private String readSetting(String name) {
		return environment.getProperty(name, "").trim();
	}

	private boolean secureEquals(String left, String right) {
		return MessageDigest.isEqual(
				left.getBytes(StandardCharsets.UTF_8),
				right.getBytes(StandardCharsets.UTF_8)
		);
	}

	private record BasicCredential(String username, String password) {
	}
}
