package com.svvape.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

	@GetMapping({"/", "/home.html", "/index.html", "/store"})
	public String home() {
		return "redirect:/store/html/home.html";
	}

	@GetMapping("/signup.html")
	public String signup() {
		return "redirect:/store/html/signup.html";
	}

	@GetMapping("/login.html")
	public String login() {
		return "redirect:/store/html/login.html";
	}

	@GetMapping("/cart.html")
	public String cart() {
		return "redirect:/store/html/cart.html";
	}

	@GetMapping("/checkout.html")
	public String checkout() {
		return "redirect:/store/html/checkout.html";
	}

	@GetMapping("/account.html")
	public String account() {
		return "redirect:/store/html/account.html";
	}

	@GetMapping({"/product-sv-nos.html", "/product-sv-nova-kit.html"})
	public String svNos() {
		return "redirect:/store/html/product-sv-nos.html";
	}

	@GetMapping("/collaboration.html")
	public String collaboration() {
		return "redirect:/store/html/collaboration.html";
	}
}
