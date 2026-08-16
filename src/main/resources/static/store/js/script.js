(() => {
  const CART_KEY = "svVapeCart";
  const LEGACY_CART_COUNT_KEY = "svVapeCartCount";
  const USER_KEY = "svVapeCurrentUser";
  const ORDER_KEY = "svVapeOrders";

  const products = [
    {
      id: "sv-nos-black",
      name: "SV NOS",
      category: "0 Nicotine",
      price: 89000,
      badge: "Disposable",
      desc: "0 니코틴 함량의 프리미엄 1회용 전자담배",
      note: "0 Nicotine disposable / graphite",
      designKind: "DISPOSABLE",
      colorClass: "tile-cobalt",
      detailUrl: "product-sv-nos.html",
      image: "../product_img/product_NOS_Black.png",
      options: ["Graphite Black", "Clean White", "Silver Gray"],
      stock: 18,
    },
  ];

  const priceFormatter = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });

  const storage = {
    getItem(key) {
      try {
        return window.localStorage.getItem(key);
      }
      catch (error) {
        return null;
      }
    },
    setItem(key, value) {
      try {
        window.localStorage.setItem(key, value);
      }
      catch (error) {
        return;
      }
    },
    removeItem(key) {
      try {
        window.localStorage.removeItem(key);
      }
      catch (error) {
        return;
      }
    },
  };

  const readJson = (key, fallback) => {
    const rawValue = storage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    try {
      return JSON.parse(rawValue);
    }
    catch (error) {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    storage.setItem(key, JSON.stringify(value));
  };

  const formatPrice = (value) => priceFormatter.format(value);

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const normalizePhone = (value) => String(value ?? "").replace(/\D/g, "");

  const getProductById = (productId) => products.find((product) => product.id === productId);

  const getItemKey = (item) => `${item.id}::${item.option ?? ""}`;

  const enrichCartItem = (item) => {
    const product = getProductById(item.id);
    if (!product) {
      return item;
    }

    return {
      ...item,
      category: item.category || product.category,
      image: item.image ?? product.image ?? "",
      visual: item.visual ?? product.visual ?? "",
      designKind: item.designKind || product.designKind || "DEVICE",
      colorClass: item.colorClass || product.colorClass || "tile-cobalt",
    };
  };

  const readCart = () => {
    const cart = readJson(CART_KEY, []);
    return Array.isArray(cart) ? cart.map(enrichCartItem) : [];
  };

  const writeCart = (cart) => {
    const normalizedCart = cart.filter((item) => item.quantity > 0);
    writeJson(CART_KEY, normalizedCart);
    storage.setItem(
      LEGACY_CART_COUNT_KEY,
      String(normalizedCart.reduce((sum, item) => sum + item.quantity, 0))
    );
    updateCartBadges(normalizedCart);
    renderCartDrawer();
    window.dispatchEvent(new CustomEvent("sv-cart-updated", { detail: { cart: normalizedCart } }));
  };

  const addToCart = (productId, options = {}) => {
    const product = getProductById(productId);
    if (!product) {
      return null;
    }

    const quantity = Math.min(10, Math.max(1, Number(options.quantity ?? 1)));
    const selectedOption = options.option || product.options[0] || "기본 옵션";
    const cart = readCart();
    const nextItem = {
      id: product.id,
      name: product.name,
      category: product.category,
      option: selectedOption,
      price: product.price,
      image: product.image ?? "",
      visual: product.visual ?? "",
      designKind: product.designKind ?? "DEVICE",
      colorClass: product.colorClass ?? "tile-cobalt",
      quantity,
    };
    const itemKey = getItemKey(nextItem);
    const existing = cart.find((item) => getItemKey(item) === itemKey);

    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + quantity);
    }
    else {
      cart.push(nextItem);
    }

    writeCart(cart);
    return nextItem;
  };

  const setCartItemQuantity = (itemKey, quantity) => {
    const cart = readCart().map((item) => {
      if (getItemKey(item) !== itemKey) {
        return item;
      }

      return {
        ...item,
        quantity: Math.min(10, Math.max(0, Number(quantity))),
      };
    });
    writeCart(cart);
  };

  const removeCartItem = (itemKey) => {
    writeCart(readCart().filter((item) => getItemKey(item) !== itemKey));
  };

  const clearCart = () => {
    writeCart([]);
  };

  const getCartTotals = (cart = readCart()) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= 50000 ? 0 : 3000;
    const total = subtotal + shipping;

    return {
      count: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      shipping,
      total,
    };
  };

  function updateCartBadges(cart = readCart()) {
    const totals = getCartTotals(cart);
    document.querySelectorAll("[data-cart-count]").forEach((count) => {
      count.textContent = String(totals.count);
    });
  }

  const itemMediaMarkup = (item) => {
    if (item.image) {
      return `<img src="${item.image}" alt="${item.name} 제품 이미지">`;
    }

    if (item.designKind) {
      return `<span class="product-shape product-shape--${String(item.designKind).toLowerCase()}" aria-hidden="true"><i></i><b></b><em></em></span>`;
    }

    return `<span class="product-visual ${item.visual}" aria-hidden="true"></span>`;
  };

  const cartDrawerItemMarkup = (item) => {
    const itemKey = getItemKey(item);

    return `
      <article class="cart-item drawer-cart-item" data-drawer-cart-item="${itemKey}">
        <div class="cart-item-media ${item.colorClass ?? "tile-cobalt"}">
          ${itemMediaMarkup(item)}
        </div>
        <div>
          <p>${item.category} · ${item.option}</p>
          <h3>${item.name}</h3>
          <strong>${formatPrice(item.price * item.quantity)}</strong>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-control" aria-label="${item.name} 수량">
            <button type="button" aria-label="수량 감소" data-drawer-cart-step="-1">-</button>
            <input type="number" min="1" max="10" value="${item.quantity}" inputmode="numeric" data-drawer-cart-quantity>
            <button type="button" aria-label="수량 증가" data-drawer-cart-step="1">+</button>
          </div>
          <button class="remove-button" type="button" data-drawer-cart-remove>삭제</button>
        </div>
      </article>
    `;
  };

  function ensureCartDrawer() {
    if (document.querySelector("[data-cart-drawer]")) {
      return;
    }

    document.body.insertAdjacentHTML("beforeend", `
      <div class="cart-drawer-backdrop" data-cart-drawer-backdrop hidden></div>
      <aside class="cart-drawer" data-cart-drawer hidden aria-label="장바구니" aria-hidden="true">
        <div class="cart-drawer-head">
          <div>
            <p class="eyebrow">Cart</p>
            <h2>장바구니</h2>
          </div>
          <button class="icon-button" type="button" aria-label="장바구니 닫기" data-cart-close>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12"></path>
              <path d="M18 6L6 18"></path>
            </svg>
          </button>
        </div>
        <div class="drawer-cart-list" data-drawer-cart-list></div>
        <div class="drawer-cart-summary" data-drawer-cart-summary></div>
        <div class="summary-actions">
          <button class="checkout-button" type="button" data-drawer-checkout>결제하기</button>
          <button class="outline-button" type="button" data-cart-close>쇼핑 계속하기</button>
        </div>
      </aside>
    `);

    const drawer = document.querySelector("[data-cart-drawer]");
    const backdrop = document.querySelector("[data-cart-drawer-backdrop]");

    backdrop?.addEventListener("click", closeCartDrawer);

    drawer.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-cart-close]");
      if (closeButton) {
        closeCartDrawer();
        return;
      }

      const itemElement = event.target.closest("[data-drawer-cart-item]");
      const stepButton = event.target.closest("[data-drawer-cart-step]");
      if (itemElement && stepButton) {
        const quantityInput = itemElement.querySelector("[data-drawer-cart-quantity]");
        const nextQuantity = Number(quantityInput.value) + Number(stepButton.dataset.drawerCartStep);
        setCartItemQuantity(itemElement.dataset.drawerCartItem, nextQuantity);
        return;
      }

      const removeButton = event.target.closest("[data-drawer-cart-remove]");
      if (itemElement && removeButton) {
        removeCartItem(itemElement.dataset.drawerCartItem);
        return;
      }

      const checkoutButton = event.target.closest("[data-drawer-checkout]");
      if (checkoutButton && !checkoutButton.disabled) {
        window.location.href = "checkout.html";
      }
    });

    drawer.addEventListener("input", (event) => {
      const quantityInput = event.target.closest("[data-drawer-cart-quantity]");
      if (!quantityInput) {
        return;
      }

      const itemElement = quantityInput.closest("[data-drawer-cart-item]");
      setCartItemQuantity(itemElement.dataset.drawerCartItem, quantityInput.value);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCartDrawer();
      }
    });
  }

  function renderCartDrawer() {
    const drawer = document.querySelector("[data-cart-drawer]");
    if (!drawer) {
      return;
    }

    const cart = readCart();
    const totals = getCartTotals(cart);
    const list = drawer.querySelector("[data-drawer-cart-list]");
    const summary = drawer.querySelector("[data-drawer-cart-summary]");
    const checkoutButton = drawer.querySelector("[data-drawer-checkout]");

    if (!cart.length) {
      list.innerHTML = `
        <div class="empty-state">
          <h2>장바구니가 비어 있습니다.</h2>
          <span>상품을 담으면 이 패널에서 바로 확인할 수 있습니다.</span>
        </div>
      `;
    }
    else {
      list.innerHTML = cart.map(cartDrawerItemMarkup).join("");
    }

    summary.innerHTML = `
      <div class="summary-line">
        <span>상품 수</span>
        <strong>${totals.count}개</strong>
      </div>
      <div class="summary-line">
        <span>상품 금액</span>
        <strong>${formatPrice(totals.subtotal)}</strong>
      </div>
      <div class="summary-line">
        <span>배송비</span>
        <strong>${totals.shipping === 0 ? "무료" : formatPrice(totals.shipping)}</strong>
      </div>
      <div class="summary-line total">
        <span>결제 예정 금액</span>
        <strong>${formatPrice(totals.total)}</strong>
      </div>
    `;

    checkoutButton.disabled = totals.count === 0;
  }

  function openCartDrawer() {
    ensureCartDrawer();
    renderCartDrawer();

    const drawer = document.querySelector("[data-cart-drawer]");
    const backdrop = document.querySelector("[data-cart-drawer-backdrop]");
    drawer.hidden = false;
    backdrop.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-drawer-open");

    window.requestAnimationFrame(() => {
      drawer.classList.add("is-open");
      backdrop.classList.add("is-open");
    });
  }

  function closeCartDrawer() {
    const drawer = document.querySelector("[data-cart-drawer]");
    const backdrop = document.querySelector("[data-cart-drawer-backdrop]");
    if (!drawer || !backdrop) {
      return;
    }

    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-drawer-open");

    window.setTimeout(() => {
      if (!drawer.classList.contains("is-open")) {
        drawer.hidden = true;
        backdrop.hidden = true;
      }
    }, 220);
  }

  const getCurrentUser = () => {
    const user = readJson(USER_KEY, null);
    return user && user.email ? user : null;
  };

  const setCurrentUser = (user) => {
    writeJson(USER_KEY, user);
    updateAuthUI();
  };

  const clearCurrentUser = () => {
    storage.removeItem(USER_KEY);
    updateAuthUI();
  };

  const readOrders = () => {
    const orders = readJson(ORDER_KEY, []);
    return Array.isArray(orders) ? orders : [];
  };

  const writeOrders = (orders) => {
    writeJson(ORDER_KEY, orders);
  };

  const orderItemsMarkup = (items = []) => items.map((item) => `
    <li>
      <span>${escapeHtml(item.name)} · ${escapeHtml(item.option)} · ${Number(item.quantity) || 1}개</span>
      <strong>${formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 1))}</strong>
    </li>
  `).join("");

  const orderResultMarkup = (order) => `
    <article class="lookup-order-card">
      <div class="lookup-order-head">
        <div>
          <p class="eyebrow">Order Found</p>
          <h3>${escapeHtml(order.id)}</h3>
        </div>
        <strong>${escapeHtml(order.status ?? "주문 접수")}</strong>
      </div>
      <dl class="lookup-order-meta">
        <div>
          <dt>주문일</dt>
          <dd>${new Date(order.createdAt).toLocaleDateString("ko-KR")}</dd>
        </div>
        <div>
          <dt>수취인</dt>
          <dd>${escapeHtml(order.shipping?.recipient ?? "-")}</dd>
        </div>
        <div>
          <dt>연락처</dt>
          <dd>${escapeHtml(order.shipping?.phone ?? "-")}</dd>
        </div>
      </dl>
      <ul class="lookup-order-items">
        ${orderItemsMarkup(order.items)}
      </ul>
      <div class="summary-line total">
        <span>결제 예정 금액</span>
        <strong>${formatPrice(order.totals?.total ?? 0)}</strong>
      </div>
    </article>
  `;

  function ensureGuestOrderDrawer() {
    if (document.querySelector("[data-order-lookup-drawer]")) {
      return;
    }

    document.body.insertAdjacentHTML("beforeend", `
      <div class="order-lookup-backdrop" data-order-lookup-backdrop hidden></div>
      <aside class="order-lookup-drawer" data-order-lookup-drawer hidden aria-label="비회원 주문조회" aria-hidden="true">
        <div class="cart-drawer-head">
          <div>
            <p class="eyebrow">Guest Order</p>
            <h2>비회원 주문조회</h2>
          </div>
          <button class="icon-button" type="button" aria-label="비회원 주문조회 닫기" data-order-lookup-close>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12"></path>
              <path d="M18 6L6 18"></path>
            </svg>
          </button>
        </div>
        <form class="order-lookup-form" data-order-lookup-form novalidate>
          <label class="form-field">
            <span>주문번호</span>
            <input name="orderId" type="text" placeholder="SV-..." autocomplete="off" required>
          </label>
          <label class="form-field">
            <span>수취인 전화번호</span>
            <input name="phone" type="tel" placeholder="010-0000-0000" autocomplete="tel" required>
          </label>
          <button class="checkout-button" type="submit">조회하기</button>
          <div class="form-status" data-order-lookup-status role="status" aria-live="polite"></div>
        </form>
        <div class="order-lookup-result" data-order-lookup-result>
          <div class="empty-state">
            <h2>주문 정보를 입력해 주세요.</h2>
            <span>주문번호와 수취인 전화번호가 일치하면 주문 상태를 확인할 수 있습니다.</span>
          </div>
        </div>
      </aside>
    `);

    const drawer = document.querySelector("[data-order-lookup-drawer]");
    const backdrop = document.querySelector("[data-order-lookup-backdrop]");
    const form = drawer.querySelector("[data-order-lookup-form]");
    const status = drawer.querySelector("[data-order-lookup-status]");
    const result = drawer.querySelector("[data-order-lookup-result]");

    backdrop?.addEventListener("click", closeGuestOrderDrawer);
    drawer.querySelectorAll("[data-order-lookup-close]").forEach((button) => {
      button.addEventListener("click", closeGuestOrderDrawer);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const orderId = String(formData.get("orderId") ?? "").trim();
      const phone = normalizePhone(formData.get("phone"));

      if (!orderId || !phone) {
        setStatus(status, "error", "주문번호와 수취인 전화번호를 모두 입력해 주세요.");
        return;
      }

      const order = readOrders().find((candidate) => (
        String(candidate.id ?? "").toUpperCase() === orderId.toUpperCase()
        && normalizePhone(candidate.shipping?.phone) === phone
      ));

      if (!order) {
        setStatus(status, "error", "일치하는 비회원 주문을 찾을 수 없습니다.");
        result.innerHTML = `
          <div class="empty-state">
            <h2>조회 결과가 없습니다.</h2>
            <span>주문번호와 전화번호를 다시 확인해 주세요.</span>
          </div>
        `;
        return;
      }

      setStatus(status, "success", "주문 정보를 확인했습니다.");
      result.innerHTML = orderResultMarkup(order);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeGuestOrderDrawer();
      }
    });
  }

  function openGuestOrderDrawer(prefill = {}) {
    ensureGuestOrderDrawer();
    closeCartDrawer();

    const drawer = document.querySelector("[data-order-lookup-drawer]");
    const backdrop = document.querySelector("[data-order-lookup-backdrop]");
    const form = drawer.querySelector("[data-order-lookup-form]");
    const status = drawer.querySelector("[data-order-lookup-status]");
    const result = drawer.querySelector("[data-order-lookup-result]");
    drawer.hidden = false;
    backdrop.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("order-lookup-open");

    if (prefill.orderId || prefill.phone) {
      const orderInput = form.querySelector("[name='orderId']");
      const phoneInput = form.querySelector("[name='phone']");
      orderInput.value = prefill.orderId ?? "";
      phoneInput.value = prefill.phone ?? "";
      form.requestSubmit();
    }
    else {
      form.reset();
      status.className = "form-status";
      status.innerHTML = "";
      result.innerHTML = `
        <div class="empty-state">
          <h2>주문 정보를 입력해 주세요.</h2>
          <span>주문번호와 수취인 전화번호가 일치하면 주문 상태를 확인할 수 있습니다.</span>
        </div>
      `;
    }

    window.requestAnimationFrame(() => {
      drawer.classList.add("is-open");
      backdrop.classList.add("is-open");
      drawer.querySelector("input")?.focus();
    });
  }

  function closeGuestOrderDrawer() {
    const drawer = document.querySelector("[data-order-lookup-drawer]");
    const backdrop = document.querySelector("[data-order-lookup-backdrop]");
    if (!drawer || !backdrop) {
      return;
    }

    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("order-lookup-open");

    window.setTimeout(() => {
      if (!drawer.classList.contains("is-open")) {
        drawer.hidden = true;
        backdrop.hidden = true;
      }
    }, 220);
  }

  const showToast = (message) => {
    let toast = document.querySelector("[data-toast]");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("data-toast", "");
      toast.setAttribute("role", "status");
      document.body.append(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  };

  const setStatus = (element, type, messages) => {
    if (!element) {
      return;
    }

    element.className = `form-status ${type}`;
    element.innerHTML = "";

    const messageList = Array.isArray(messages) ? messages : [messages];
    messageList.forEach((message) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = message;
      element.append(paragraph);
    });
  };

  function updateAuthUI() {
    const user = getCurrentUser();
    document.querySelectorAll("[data-auth-link]").forEach((link) => {
      link.hidden = false;
      link.textContent = user ? "마이페이지" : "로그인";
      link.setAttribute("href", user ? "account.html" : "login.html");
    });
    document.querySelectorAll("[data-signup-link]").forEach((link) => {
      link.hidden = Boolean(user);
    });
    document.querySelectorAll("[data-account-link]").forEach((link) => {
      link.hidden = true;
    });
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.hidden = !user;
    });
  }

  const productMarkup = (product) => {
    const media = product.image
      ? `<img src="${product.image}" alt="${product.name} 제품 이미지">`
      : `<span class="product-shape product-shape--${String(product.designKind ?? "DEVICE").toLowerCase()}" aria-hidden="true"><i></i><b></b><em></em></span>`;
    const primaryClass = product.id === "sv-nos-black" ? " primary-product" : "";

    return `
      <article class="product-card${primaryClass}" data-product-card data-category="${product.category}" data-search-text="${product.name} ${product.category} ${product.desc}">
        <div class="product-media-wrap">
          <a class="product-card-image ${product.colorClass ?? "tile-cobalt"}" href="${product.detailUrl}" aria-label="${product.name} 상세보기">
            ${media}
            <span class="product-code">0${products.indexOf(product) + 1} / ${product.designKind ?? product.badge}</span>
          </a>
          <button class="floating-add-button" type="button" data-cart-add-product="${product.id}" aria-label="${product.name} 장바구니에 담기">+</button>
        </div>
        <p class="product-type">${product.badge} · ${product.category}</p>
        <h3><a href="${product.detailUrl}">${product.name}</a></h3>
        <p class="product-desc">${product.note ?? product.desc}</p>
        <div class="product-bottom">
          <strong>${formatPrice(product.price)}</strong>
          <div class="product-actions">
            <a class="product-detail-link" href="${product.detailUrl}">상세</a>
          </div>
        </div>
      </article>
    `;
  };

  const renderProductGrid = () => {
    const grid = document.querySelector("[data-product-grid]");
    if (!grid) {
      return;
    }

    grid.classList.toggle("single-product-grid", products.length === 1);
    grid.innerHTML = products.map(productMarkup).join("");

    document.querySelectorAll("[data-cart-add-product]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = addToCart(button.dataset.cartAddProduct);
        if (item) {
          showToast(`${item.name} 1개가 장바구니에 담겼습니다.`);
        }
      });
    });

    applyProductFilters();
  };

  const applyProductFilters = () => {
    const productCards = Array.from(document.querySelectorAll("[data-product-card]"));
    const emptyState = document.querySelector("[data-product-empty]");
    if (!productCards.length) {
      return;
    }

    const activeFilter = document.querySelector("[data-category-filter].is-active");
    const category = activeFilter?.dataset.categoryFilter ?? "전체";
    const query = String(document.querySelector("#store-search")?.value ?? "")
      .trim()
      .toLowerCase();
    let visibleCount = 0;

    productCards.forEach((card) => {
      const matchesCategory = category === "전체" || card.dataset.category === category;
      const matchesQuery = !query || String(card.dataset.searchText ?? "").toLowerCase().includes(query);
      const isVisible = matchesCategory && matchesQuery;
      card.hidden = !isVisible;

      if (isVisible) {
        visibleCount += 1;
      }
    });

    emptyState?.classList.toggle("is-visible", visibleCount === 0);
  };

  const initHeader = () => {
    const body = document.body;
    const slides = Array.from(document.querySelectorAll("[data-slide]"));
    const dots = Array.from(document.querySelectorAll("[data-slide-dot]"));
    const prevButton = document.querySelector("[data-slide-prev]");
    const nextButton = document.querySelector("[data-slide-next]");
    const searchToggle = document.querySelector("[data-search-toggle]");
    const searchBar = document.querySelector("[data-search-bar]");
    const searchInput = document.querySelector("#store-search");
    const searchForm = document.querySelector("[data-search-form]");
    const menuToggle = document.querySelector("[data-menu-toggle]");
    const mobileMenu = document.querySelector("[data-mobile-menu]");

    let activeSlide = 0;

    if (mobileMenu && !mobileMenu.querySelector("[data-guest-order-open]")) {
      const lookupButton = document.createElement("button");
      lookupButton.type = "button";
      lookupButton.dataset.guestOrderOpen = "";
      lookupButton.textContent = "비회원 주문조회";
      const accountLink = mobileMenu.querySelector("[data-account-link]");
      mobileMenu.insertBefore(lookupButton, accountLink);
    }

    const setSlide = (index) => {
      if (!slides.length) {
        return;
      }

      activeSlide = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("active", slideIndex === activeSlide);
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === activeSlide);
      });
    };

    prevButton?.addEventListener("click", () => setSlide(activeSlide - 1));
    nextButton?.addEventListener("click", () => setSlide(activeSlide + 1));

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        setSlide(Number(dot.dataset.slideDot));
      });
    });

    searchToggle?.addEventListener("click", () => {
      const isOpen = searchBar?.classList.toggle("is-open");
      if (isOpen) {
        searchInput?.focus();
      }
    });

    searchForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (document.querySelector("[data-product-grid]")) {
        applyProductFilters();
        document.querySelector("#featured")?.scrollIntoView({ block: "start" });
        return;
      }

      const query = encodeURIComponent(String(searchInput?.value ?? "").trim());
      window.location.href = query ? `home.html?search=${query}#featured` : "home.html#featured";
    });

    searchInput?.addEventListener("input", applyProductFilters);

    if (searchInput) {
      searchInput.placeholder = "SV NOS, 0 니코틴 검색";
    }

    menuToggle?.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      mobileMenu?.classList.toggle("is-open", !isOpen);
      body.classList.toggle("menu-open", !isOpen);
    });

    mobileMenu?.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement || event.target instanceof HTMLButtonElement) {
        menuToggle?.setAttribute("aria-expanded", "false");
        mobileMenu.classList.remove("is-open");
        body.classList.remove("menu-open");
      }
    });

    document.querySelectorAll("[data-cart-open], .site-header a[href='cart.html']").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        openCartDrawer();
      });
    });

    document.querySelectorAll("[data-guest-order-open]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        openGuestOrderDrawer();
      });
    });

    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", () => {
        clearCurrentUser();
        showToast("로그아웃되었습니다.");
        if (button.dataset.redirectHome === "true") {
          window.location.href = "home.html";
        }
      });
    });

    document.querySelectorAll("[data-category-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-category-filter]").forEach((filter) => {
          filter.classList.toggle("is-active", filter === button);
        });
        applyProductFilters();
      });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get("search");
    if (searchQuery && searchInput) {
      searchBar?.classList.add("is-open");
      searchInput.value = searchQuery;
      applyProductFilters();
    }

    setSlide(0);
    updateCartBadges();
    updateAuthUI();
  };

  window.SVStore = {
    products,
    formatPrice,
    getProductById,
    getItemKey,
    readCart,
    writeCart,
    addToCart,
    setCartItemQuantity,
    removeCartItem,
    clearCart,
    getCartTotals,
    updateCartBadges,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    readOrders,
    writeOrders,
    setStatus,
    showToast,
    openCartDrawer,
    openGuestOrderDrawer,
  };

  renderProductGrid();
  initHeader();
})();
