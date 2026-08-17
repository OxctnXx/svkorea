package com.svvape.order;

public class OrderNotFoundException extends RuntimeException {

	public OrderNotFoundException(String message) {
		super(message);
	}
}
