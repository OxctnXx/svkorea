(() => {
  const store = window.SVStore;
  const signupForm = document.querySelector("[data-signup-form]");
  const signupStatus = document.querySelector("[data-signup-status]");

  if (!signupForm || !store) {
    return;
  }

  const readSignupForm = (form) => {
    const formData = new FormData(form);

    return {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      adultConfirmed: formData.has("adultConfirmed"),
      termsAccepted: formData.has("termsAccepted"),
      marketingAgreed: formData.has("marketingAgreed"),
    };
  };

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (window.location.protocol === "file:") {
      store.setStatus(signupStatus, "error", "회원 정보 저장은 로컬 서버 주소에서 이용해 주세요.");
      return;
    }

    const submitButton = signupForm.querySelector("button[type='submit']");
    const payload = readSignupForm(signupForm);

    if (payload.password !== payload.passwordConfirm) {
      store.setStatus(signupStatus, "error", "비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "가입 처리 중";
    store.setStatus(signupStatus, "pending", "회원 정보를 저장하고 있습니다.");

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        store.setStatus(signupStatus, "error", result.errors ?? result.message ?? "회원가입에 실패했습니다.");
        return;
      }

      store.setCurrentUser({
        memberId: result.memberId,
        email: result.email,
        name: result.name,
      });
      signupForm.reset();
      store.setStatus(signupStatus, "success", `${result.name}님의 회원가입이 완료되었습니다.`);
    }
    catch (error) {
      store.setStatus(signupStatus, "error", "로컬 서버에 연결할 수 없습니다. 앱 실행 상태를 확인해 주세요.");
    }
    finally {
      submitButton.disabled = false;
      submitButton.textContent = "회원가입";
    }
  });
})();
