package com.svvape.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

	@GetMapping({"/", "/index.html", "/store"})
	public String index() {
		return "redirect:/store/html/index.html";
	}

	@GetMapping("/signup.html")
	public String signup() {
		return "redirect:/store/html/signup.html";
	}
}
