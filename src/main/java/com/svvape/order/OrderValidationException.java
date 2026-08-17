package com.svvape.order;

import java.util.List;

public class OrderValidationException extends RuntimeException {

	private final List<String> errors;

	public OrderValidationException(List<String> errors) {
		super(String.join(", ", errors));
		this.errors = errors;
	}

	public List<String> getErrors() {
		return errors;
	}
}
