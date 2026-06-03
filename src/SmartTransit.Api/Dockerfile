FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Çözüm dosyasını ve proje dosyalarını kopyala
COPY *.slnx ./
COPY src/SmartTransit.Domain/*.csproj ./src/SmartTransit.Domain/
COPY src/SmartTransit.Application/*.csproj ./src/SmartTransit.Application/
COPY src/SmartTransit.Infrastructure/*.csproj ./src/SmartTransit.Infrastructure/
COPY src/SmartTransit.Api/*.csproj ./src/SmartTransit.Api/

# Restorasyon yap
RUN dotnet restore src/SmartTransit.Api/SmartTransit.Api.csproj

# Tüm kodu kopyala ve yayınla
COPY src/ ./src/
RUN dotnet publish src/SmartTransit.Api/SmartTransit.Api.csproj -c Release -o out

# Runtime imajını hazırla
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build-env /app/out .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "SmartTransit.Api.dll"]
