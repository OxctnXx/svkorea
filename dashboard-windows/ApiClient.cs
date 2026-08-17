using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace SVKoreaDashboard;

public sealed class ApiClient : IDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient httpClient = new();

    public ApiClient(string baseUrl)
    {
        if (!baseUrl.EndsWith('/'))
        {
            baseUrl += "/";
        }

        httpClient.BaseAddress = new Uri(baseUrl);
        httpClient.Timeout = TimeSpan.FromSeconds(20);
    }

    public void SetCredentials(string username, string password)
    {
        string token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
    }

    public Task<AdminSession> CheckSessionAsync()
    {
        return GetAsync<AdminSession>("api/admin/session");
    }

    public Task<DashboardSummary> GetSummaryAsync()
    {
        return GetAsync<DashboardSummary>("api/admin/summary");
    }

    public Task<List<OrderView>> GetOrdersAsync(string query)
    {
        string path = "api/admin/orders?limit=200";
        if (!string.IsNullOrWhiteSpace(query))
        {
            path += "&query=" + Uri.EscapeDataString(query.Trim());
        }

        return GetAsync<List<OrderView>>(path);
    }

    public Task<List<MemberView>> GetMembersAsync(string query)
    {
        string path = "api/admin/members?limit=200";
        if (!string.IsNullOrWhiteSpace(query))
        {
            path += "&query=" + Uri.EscapeDataString(query.Trim());
        }

        return GetAsync<List<MemberView>>(path);
    }

    private async Task<T> GetAsync<T>(string path)
    {
        using HttpResponseMessage response = await httpClient.GetAsync(path);
        string body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            string message = TryReadMessage(body);
            throw new DashboardApiException(string.IsNullOrWhiteSpace(message)
                ? $"서버 요청 실패: {(int)response.StatusCode}"
                : message);
        }

        T? result = JsonSerializer.Deserialize<T>(body, JsonOptions);
        return result ?? throw new DashboardApiException("서버 응답을 읽을 수 없습니다.");
    }

    private static string TryReadMessage(string body)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(body);
            return document.RootElement.TryGetProperty("message", out JsonElement message)
                ? message.GetString() ?? ""
                : "";
        }
        catch (JsonException)
        {
            return "";
        }
    }

    public void Dispose()
    {
        httpClient.Dispose();
    }
}
