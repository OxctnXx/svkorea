namespace SVKoreaDashboard;

public sealed class AdminSession
{
    public bool Authenticated { get; set; }
    public string? Message { get; set; }
}

public sealed class DashboardSummary
{
    public long TotalOrders { get; set; }
    public long ReceivedOrders { get; set; }
    public long TotalMembers { get; set; }
    public long TotalRevenue { get; set; }
    public DateTime? LatestOrderAt { get; set; }
}

public sealed class OrderView
{
    public long Id { get; set; }
    public string? OrderNo { get; set; }
    public string? Status { get; set; }
    public string? OrderType { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? RecipientEmail { get; set; }
    public string? ShippingAddress { get; set; }
    public string? ShippingMemo { get; set; }
    public string? PaymentMethod { get; set; }
    public long SubtotalAmount { get; set; }
    public long ShippingFee { get; set; }
    public long TotalAmount { get; set; }
    public string? CourierCompany { get; set; }
    public string? TrackingNo { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? MemberEmail { get; set; }
    public string? MemberName { get; set; }
    public List<OrderItemView> Items { get; set; } = [];
}

public sealed class OrderItemView
{
    public string? ProductName { get; set; }
    public string? OptionName { get; set; }
    public long UnitPrice { get; set; }
    public int Quantity { get; set; }
    public long LineTotal { get; set; }
}

public sealed class MemberView
{
    public long Id { get; set; }
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public DateTime? BirthDate { get; set; }
    public bool AdultConfirmed { get; set; }
    public bool TermsAccepted { get; set; }
    public bool MarketingAgreed { get; set; }
    public string? Status { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public sealed class OrderGridRow
{
    public string OrderNo { get; set; } = "";
    public string Status { get; set; } = "";
    public string RecipientName { get; set; } = "";
    public string RecipientPhone { get; set; } = "";
    public string RecipientEmail { get; set; } = "";
    public string TotalAmount { get; set; } = "";
    public string PaymentMethod { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}

public sealed class MemberGridRow
{
    public long Id { get; set; }
    public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Status { get; set; } = "";
    public string AdultConfirmed { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}
