package com.svvape.admin;

import org.springframework.http.HttpStatus;

public class AdminAuthenticationException extends RuntimeException {

	private final HttpStatus status;

	public AdminAuthenticationException(HttpStatus status, String message) {
		super(message);
		this.status = status;
	}

	public HttpStatus getStatus() {
		return status;
	}
}
