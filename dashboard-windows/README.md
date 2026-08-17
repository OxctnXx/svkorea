# SV Korea Dashboard

Windows desktop dashboard for SV Korea operations.

## Build

```powershell
dotnet publish .\dashboard-windows\SVKoreaDashboard.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:PublishReadyToRun=false /p:IncludeNativeLibrariesForSelfExtract=true /p:EnableCompressionInSingleFile=true
```

The executable is emitted under:

```text
dashboard-windows\bin\Release\net8.0-windows\win-x64\publish\SVKoreaDashboard.exe
```

## Login

The app connects to `https://svkorea.kr` by default and uses the server-side `ADMIN_USERNAME` and `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` environment variables.
