(() => {
  const store = window.SVStore;
  const loginForm = document.querySelector("[data-login-form]");
  const loginStatus = document.querySelector("[data-login-status]");

  if (!store || !loginForm) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get("redirect") || "account.html";

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (window.location.protocol === "file:") {
      store.setStatus(loginStatus, "error", "로그인은 로컬 서버 주소에서 이용해 주세요.");
      return;
    }

    const submitButton = loginForm.querySelector("button[type='submit']");
    const formData = new FormData(loginForm);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      keepSignedIn: formData.has("keepSignedIn"),
    };

    submitButton.disabled = true;
    submitButton.textContent = "로그인 중";
    store.setStatus(loginStatus, "pending", "계정을 확인하고 있습니다.");

    try {
      const response = await fetch("/api/members/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        store.setStatus(loginStatus, "error", result.message ?? "이메일 또는 비밀번호를 확인해 주세요.");
        return;
      }

      store.setCurrentUser({
        memberId: result.memberId,
        email: result.email,
        name: result.name,
      });
      store.setStatus(loginStatus, "success", `${result.name}님, 다시 오신 것을 환영합니다.`);
      window.setTimeout(() => {
        window.location.href = redirectTo;
      }, 700);
    }
    catch (error) {
      store.setStatus(loginStatus, "error", "로컬 서버에 연결할 수 없습니다. 앱 실행 상태를 확인해 주세요.");
    }
    finally {
      submitButton.disabled = false;
      submitButton.textContent = "로그인";
    }
  });
})();
