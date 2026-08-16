package com.svvape.member;

import java.util.List;

public class SignupValidationException extends RuntimeException {

	private final List<String> errors;

	public SignupValidationException(List<String> errors) {
		super("Invalid signup request");
		this.errors = List.copyOf(errors);
	}

	public List<String> getErrors() {
		return errors;
	}
}
