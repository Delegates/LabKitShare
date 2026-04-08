# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src

COPY LabKitShare/LabKitShare.csproj LabKitShare/
RUN dotnet restore LabKitShare/LabKitShare.csproj

COPY LabKitShare/ LabKitShare/
RUN dotnet publish LabKitShare/LabKitShare.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine
WORKDIR /app
COPY --from=build /app/publish .

RUN mkdir -p /data

ENV ASPNETCORE_URLS=http://+:5000
ENV DB_PATH=/data/share.db
EXPOSE 5000

ENTRYPOINT ["dotnet", "LabKitShare.dll"]
