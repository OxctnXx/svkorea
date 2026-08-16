(() => {
  const store = window.SVStore;
  const accountShell = document.querySelector("[data-account-shell]");
  const guestShell = document.querySelector("[data-guest-shell]");
  const orderList = document.querySelector("[data-order-list]");
  const accountName = document.querySelector("[data-account-name]");
  const accountEmail = document.querySelector("[data-account-email]");

  if (!store || !accountShell || !guestShell) {
    return;
  }

  const user = store.getCurrentUser();

  if (!user) {
    accountShell.hidden = true;
    guestShell.hidden = false;
    return;
  }

  accountShell.hidden = false;
  guestShell.hidden = true;
  accountName.textContent = user.name;
  accountEmail.textContent = user.email;

  const orders = store.readOrders();
  if (!orders.length) {
    orderList.innerHTML = `
      <div class="empty-state">
        <h2>아직 주문 내역이 없습니다.</h2>
        <span>첫 주문을 완료하면 접수 내역이 이곳에 표시됩니다.</span>
        <a class="product-detail-link" href="home.html#featured">상품 보러가기</a>
      </div>
    `;
    return;
  }

  orderList.innerHTML = orders.map((order) => `
    <article class="order-card">
      <h3>
        <span>${order.id}</span>
        <span>${order.status}</span>
      </h3>
      <time datetime="${order.createdAt}">${new Date(order.createdAt).toLocaleDateString("ko-KR")}</time>
      <ul>
        ${order.items.map((item) => `<li>${item.name} · ${item.option} · ${item.quantity}개</li>`).join("")}
      </ul>
      <p><strong>${store.formatPrice(order.totals.total)}</strong></p>
    </article>
  `).join("");
})();
