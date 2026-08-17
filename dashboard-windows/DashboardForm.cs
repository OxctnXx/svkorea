using System.ComponentModel;
using System.Drawing;
using System.Globalization;

namespace SVKoreaDashboard;

public sealed class DashboardForm : Form
{
    private readonly TextBox serverUrlBox = new() { Text = "https://svkorea.kr", Width = 260 };
    private readonly TextBox usernameBox = new() { Text = "admin", Width = 160 };
    private readonly TextBox passwordBox = new() { Width = 180, UseSystemPasswordChar = true };
    private readonly Button loginButton = new() { Text = "로그인", Width = 90 };
    private readonly Label statusLabel = new() { AutoSize = true, ForeColor = Color.FromArgb(84, 96, 112) };

    private readonly Label totalOrdersLabel = SummaryLabel();
    private readonly Label receivedOrdersLabel = SummaryLabel();
    private readonly Label totalMembersLabel = SummaryLabel();
    private readonly Label totalRevenueLabel = SummaryLabel();

    private readonly TextBox orderSearchBox = new() { Width = 260 };
    private readonly Button orderRefreshButton = new() { Text = "주문 새로고침", Width = 120 };
    private readonly DataGridView orderGrid = Grid();
    private readonly TextBox orderDetailBox = new()
    {
        Multiline = true,
        ReadOnly = true,
        ScrollBars = ScrollBars.Vertical,
        Dock = DockStyle.Fill,
        Font = new Font("Consolas", 10)
    };

    private readonly TextBox memberSearchBox = new() { Width = 260 };
    private readonly Button memberRefreshButton = new() { Text = "회원 새로고침", Width = 120 };
    private readonly DataGridView memberGrid = Grid();

    private ApiClient? apiClient;
    private List<OrderView> currentOrders = [];

    public DashboardForm()
    {
        Text = "SV Korea Dashboard";
        Width = 1280;
        Height = 820;
        MinimumSize = new Size(1080, 680);
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Segoe UI", 10);
        BackColor = Color.FromArgb(244, 247, 250);

        Controls.Add(BuildLayout());
        WireEvents();
    }

    private Control BuildLayout()
    {
        TableLayoutPanel root = new()
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 4,
            Padding = new Padding(18),
            BackColor = BackColor
        };
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        Label title = new()
        {
            Text = "SV Korea 운영 대시보드",
            AutoSize = true,
            Font = new Font("Segoe UI", 18, FontStyle.Bold),
            ForeColor = Color.FromArgb(32, 43, 54),
            Margin = new Padding(0, 0, 0, 12)
        };

        root.Controls.Add(title, 0, 0);
        root.Controls.Add(BuildLoginBar(), 0, 1);
        root.Controls.Add(BuildSummaryBar(), 0, 2);
        root.Controls.Add(BuildTabs(), 0, 3);
        return root;
    }

    private Control BuildLoginBar()
    {
        FlowLayoutPanel panel = new()
        {
            Dock = DockStyle.Fill,
            AutoSize = true,
            Padding = new Padding(0, 0, 0, 12)
        };
        panel.Controls.Add(Field("서버", serverUrlBox));
        panel.Controls.Add(Field("아이디", usernameBox));
        panel.Controls.Add(Field("비밀번호", passwordBox));
        panel.Controls.Add(loginButton);
        panel.Controls.Add(statusLabel);
        return panel;
    }

    private Control BuildSummaryBar()
    {
        TableLayoutPanel panel = new()
        {
            Dock = DockStyle.Top,
            ColumnCount = 4,
            RowCount = 1,
            Height = 86,
            Margin = new Padding(0, 0, 0, 12)
        };
        for (int i = 0; i < 4; i++)
        {
            panel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 25));
        }

        panel.Controls.Add(SummaryCard("전체 주문", totalOrdersLabel), 0, 0);
        panel.Controls.Add(SummaryCard("접수 주문", receivedOrdersLabel), 1, 0);
        panel.Controls.Add(SummaryCard("회원", totalMembersLabel), 2, 0);
        panel.Controls.Add(SummaryCard("매출 합계", totalRevenueLabel), 3, 0);
        return panel;
    }

    private Control BuildTabs()
    {
        TabControl tabs = new() { Dock = DockStyle.Fill };
        tabs.TabPages.Add(BuildOrdersTab());
        tabs.TabPages.Add(BuildMembersTab());
        return tabs;
    }

    private TabPage BuildOrdersTab()
    {
        TabPage tab = new("주문");
        TableLayoutPanel root = new()
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Padding = new Padding(12)
        };
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        FlowLayoutPanel toolbar = new() { Dock = DockStyle.Top, AutoSize = true, Padding = new Padding(0, 0, 0, 10) };
        toolbar.Controls.Add(Field("검색", orderSearchBox));
        toolbar.Controls.Add(orderRefreshButton);

        SplitContainer split = new()
        {
            Dock = DockStyle.Fill,
            Orientation = Orientation.Horizontal,
            SplitterDistance = 350
        };
        ConfigureOrderGrid();
        split.Panel1.Controls.Add(orderGrid);
        split.Panel2.Controls.Add(orderDetailBox);

        root.Controls.Add(toolbar, 0, 0);
        root.Controls.Add(split, 0, 1);
        tab.Controls.Add(root);
        return tab;
    }

    private TabPage BuildMembersTab()
    {
        TabPage tab = new("회원");
        TableLayoutPanel root = new()
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 2,
            Padding = new Padding(12)
        };
        root.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        FlowLayoutPanel toolbar = new() { Dock = DockStyle.Top, AutoSize = true, Padding = new Padding(0, 0, 0, 10) };
        toolbar.Controls.Add(Field("검색", memberSearchBox));
        toolbar.Controls.Add(memberRefreshButton);

        ConfigureMemberGrid();
        root.Controls.Add(toolbar, 0, 0);
        root.Controls.Add(memberGrid, 0, 1);
        tab.Controls.Add(root);
        return tab;
    }

    private void WireEvents()
    {
        loginButton.Click += async (_, _) => await LoginAsync();
        passwordBox.KeyDown += async (_, e) =>
        {
            if (e.KeyCode == Keys.Enter)
            {
                await LoginAsync();
            }
        };
        orderRefreshButton.Click += async (_, _) => await LoadOrdersAsync();
        memberRefreshButton.Click += async (_, _) => await LoadMembersAsync();
        orderSearchBox.KeyDown += async (_, e) =>
        {
            if (e.KeyCode == Keys.Enter)
            {
                await LoadOrdersAsync();
            }
        };
        memberSearchBox.KeyDown += async (_, e) =>
        {
            if (e.KeyCode == Keys.Enter)
            {
                await LoadMembersAsync();
            }
        };
        orderGrid.SelectionChanged += (_, _) => ShowSelectedOrder();
    }

    private async Task LoginAsync()
    {
        SetBusy(true, "로그인 확인 중...");

        try
        {
            apiClient?.Dispose();
            apiClient = new ApiClient(serverUrlBox.Text.Trim());
            apiClient.SetCredentials(usernameBox.Text.Trim(), passwordBox.Text);
            await apiClient.CheckSessionAsync();
            statusLabel.Text = "로그인됨";
            statusLabel.ForeColor = Color.FromArgb(26, 128, 84);
            await RefreshAllAsync();
        }
        catch (Exception exception)
        {
            statusLabel.Text = exception.Message;
            statusLabel.ForeColor = Color.FromArgb(184, 55, 69);
        }
        finally
        {
            SetBusy(false);
        }
    }

    private async Task RefreshAllAsync()
    {
        await LoadSummaryAsync();
        await LoadOrdersAsync();
        await LoadMembersAsync();
    }

    private async Task LoadSummaryAsync()
    {
        if (apiClient == null)
        {
            return;
        }

        DashboardSummary summary = await apiClient.GetSummaryAsync();
        totalOrdersLabel.Text = summary.TotalOrders.ToString("N0", CultureInfo.CurrentCulture);
        receivedOrdersLabel.Text = summary.ReceivedOrders.ToString("N0", CultureInfo.CurrentCulture);
        totalMembersLabel.Text = summary.TotalMembers.ToString("N0", CultureInfo.CurrentCulture);
        totalRevenueLabel.Text = FormatWon(summary.TotalRevenue);
    }

    private async Task LoadOrdersAsync()
    {
        if (apiClient == null)
        {
            statusLabel.Text = "먼저 로그인해 주세요.";
            return;
        }

        SetBusy(true, "주문 조회 중...");
        try
        {
            currentOrders = await apiClient.GetOrdersAsync(orderSearchBox.Text);
            BindingList<OrderGridRow> rows = new(currentOrders.Select(order => new OrderGridRow
            {
                OrderNo = order.OrderNo ?? "",
                Status = order.Status ?? "",
                RecipientName = order.RecipientName ?? "",
                RecipientPhone = order.RecipientPhone ?? "",
                RecipientEmail = order.RecipientEmail ?? "",
                TotalAmount = FormatWon(order.TotalAmount),
                PaymentMethod = order.PaymentMethod ?? "",
                CreatedAt = FormatDateTime(order.CreatedAt)
            }).ToList());
            orderGrid.DataSource = rows;
            ShowSelectedOrder();
            statusLabel.Text = $"주문 {rows.Count:N0}건 조회됨";
            statusLabel.ForeColor = Color.FromArgb(84, 96, 112);
        }
        catch (Exception exception)
        {
            statusLabel.Text = exception.Message;
            statusLabel.ForeColor = Color.FromArgb(184, 55, 69);
        }
        finally
        {
            SetBusy(false);
        }
    }

    private async Task LoadMembersAsync()
    {
        if (apiClient == null)
        {
            statusLabel.Text = "먼저 로그인해 주세요.";
            return;
        }

        SetBusy(true, "회원 조회 중...");
        try
        {
            List<MemberView> members = await apiClient.GetMembersAsync(memberSearchBox.Text);
            BindingList<MemberGridRow> rows = new(members.Select(member => new MemberGridRow
            {
                Id = member.Id,
                Email = member.Email ?? "",
                Name = member.Name ?? "",
                Phone = member.Phone ?? "",
                Status = member.Status ?? "",
                AdultConfirmed = member.AdultConfirmed ? "Y" : "N",
                CreatedAt = FormatDateTime(member.CreatedAt)
            }).ToList());
            memberGrid.DataSource = rows;
            statusLabel.Text = $"회원 {rows.Count:N0}명 조회됨";
            statusLabel.ForeColor = Color.FromArgb(84, 96, 112);
        }
        catch (Exception exception)
        {
            statusLabel.Text = exception.Message;
            statusLabel.ForeColor = Color.FromArgb(184, 55, 69);
        }
        finally
        {
            SetBusy(false);
        }
    }

    private void ShowSelectedOrder()
    {
        if (orderGrid.CurrentRow == null || orderGrid.CurrentRow.DataBoundItem is not OrderGridRow row)
        {
            orderDetailBox.Text = "";
            return;
        }

        OrderView? order = currentOrders.FirstOrDefault(item => item.OrderNo == row.OrderNo);
        if (order == null)
        {
            orderDetailBox.Text = "";
            return;
        }

        string items = string.Join(Environment.NewLine, order.Items.Select(item =>
            $"- {item.ProductName} / {item.OptionName} / {item.Quantity:N0}개 / {FormatWon(item.LineTotal)}"));

        orderDetailBox.Text =
            $"주문번호: {order.OrderNo}{Environment.NewLine}" +
            $"상태: {order.Status}{Environment.NewLine}" +
            $"주문유형: {order.OrderType}{Environment.NewLine}" +
            $"주문일시: {FormatDateTime(order.CreatedAt)}{Environment.NewLine}" +
            $"수령인: {order.RecipientName}{Environment.NewLine}" +
            $"연락처: {order.RecipientPhone}{Environment.NewLine}" +
            $"이메일: {order.RecipientEmail}{Environment.NewLine}" +
            $"회원: {order.MemberName} / {order.MemberEmail}{Environment.NewLine}" +
            $"배송지: {order.ShippingAddress}{Environment.NewLine}" +
            $"배송메모: {order.ShippingMemo}{Environment.NewLine}" +
            $"결제수단: {order.PaymentMethod}{Environment.NewLine}" +
            $"상품금액: {FormatWon(order.SubtotalAmount)}{Environment.NewLine}" +
            $"배송비: {FormatWon(order.ShippingFee)}{Environment.NewLine}" +
            $"총액: {FormatWon(order.TotalAmount)}{Environment.NewLine}" +
            $"택배사: {order.CourierCompany}{Environment.NewLine}" +
            $"운송장: {order.TrackingNo}{Environment.NewLine}{Environment.NewLine}" +
            $"상품{Environment.NewLine}{items}";
    }

    private void ConfigureOrderGrid()
    {
        AddColumn(orderGrid, nameof(OrderGridRow.OrderNo), "주문번호", 140);
        AddColumn(orderGrid, nameof(OrderGridRow.Status), "상태", 90);
        AddColumn(orderGrid, nameof(OrderGridRow.RecipientName), "수령인", 120);
        AddColumn(orderGrid, nameof(OrderGridRow.RecipientPhone), "연락처", 140);
        AddColumn(orderGrid, nameof(OrderGridRow.RecipientEmail), "이메일", 190);
        AddColumn(orderGrid, nameof(OrderGridRow.TotalAmount), "총액", 110);
        AddColumn(orderGrid, nameof(OrderGridRow.PaymentMethod), "결제", 110);
        AddColumn(orderGrid, nameof(OrderGridRow.CreatedAt), "주문일시", 170);
    }

    private void ConfigureMemberGrid()
    {
        AddColumn(memberGrid, nameof(MemberGridRow.Id), "ID", 70);
        AddColumn(memberGrid, nameof(MemberGridRow.Email), "이메일", 230);
        AddColumn(memberGrid, nameof(MemberGridRow.Name), "이름", 130);
        AddColumn(memberGrid, nameof(MemberGridRow.Phone), "연락처", 150);
        AddColumn(memberGrid, nameof(MemberGridRow.Status), "상태", 100);
        AddColumn(memberGrid, nameof(MemberGridRow.AdultConfirmed), "성인확인", 90);
        AddColumn(memberGrid, nameof(MemberGridRow.CreatedAt), "가입일시", 170);
    }

    private void SetBusy(bool busy, string? message = null)
    {
        Cursor = busy ? Cursors.WaitCursor : Cursors.Default;
        loginButton.Enabled = !busy;
        orderRefreshButton.Enabled = !busy;
        memberRefreshButton.Enabled = !busy;
        if (!string.IsNullOrWhiteSpace(message))
        {
            statusLabel.Text = message;
            statusLabel.ForeColor = Color.FromArgb(84, 96, 112);
        }
    }

    private static Control Field(string label, Control input)
    {
        FlowLayoutPanel panel = new()
        {
            AutoSize = true,
            FlowDirection = FlowDirection.LeftToRight,
            Margin = new Padding(0, 0, 12, 0)
        };
        panel.Controls.Add(new Label
        {
            Text = label,
            AutoSize = true,
            Padding = new Padding(0, 7, 6, 0),
            ForeColor = Color.FromArgb(73, 85, 101)
        });
        panel.Controls.Add(input);
        return panel;
    }

    private static Control SummaryCard(string title, Label value)
    {
        Panel card = new()
        {
            Dock = DockStyle.Fill,
            Margin = new Padding(0, 0, 12, 0),
            Padding = new Padding(14),
            BackColor = Color.White
        };
        Label titleLabel = new()
        {
            Text = title,
            AutoSize = true,
            ForeColor = Color.FromArgb(95, 107, 123),
            Location = new Point(14, 12)
        };
        value.Location = new Point(14, 38);
        card.Controls.Add(titleLabel);
        card.Controls.Add(value);
        return card;
    }

    private static Label SummaryLabel()
    {
        return new Label
        {
            Text = "-",
            AutoSize = true,
            Font = new Font("Segoe UI", 18, FontStyle.Bold),
            ForeColor = Color.FromArgb(32, 43, 54)
        };
    }

    private static DataGridView Grid()
    {
        return new DataGridView
        {
            Dock = DockStyle.Fill,
            AutoGenerateColumns = false,
            AllowUserToAddRows = false,
            AllowUserToDeleteRows = false,
            AllowUserToResizeRows = false,
            ReadOnly = true,
            SelectionMode = DataGridViewSelectionMode.FullRowSelect,
            MultiSelect = false,
            BackgroundColor = Color.White,
            BorderStyle = BorderStyle.None,
            RowHeadersVisible = false,
            AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
        };
    }

    private static void AddColumn(DataGridView grid, string propertyName, string header, int width)
    {
        grid.Columns.Add(new DataGridViewTextBoxColumn
        {
            DataPropertyName = propertyName,
            HeaderText = header,
            Name = propertyName,
            MinimumWidth = Math.Min(width, 80),
            Width = width
        });
    }

    private static string FormatWon(long value)
    {
        return value.ToString("N0", CultureInfo.CurrentCulture) + "원";
    }

    private static string FormatDateTime(DateTime? value)
    {
        return value.HasValue ? value.Value.ToString("yyyy-MM-dd HH:mm", CultureInfo.CurrentCulture) : "";
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            apiClient?.Dispose();
        }

        base.Dispose(disposing);
    }
}
