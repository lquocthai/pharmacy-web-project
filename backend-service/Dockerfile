# === STAGE 1: Build ứng dụng với Maven và JDK 21 ===
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy file pom.xml và tải trước các dependencies (giúp cache Docker chạy nhanh hơn)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy toàn bộ mã nguồn vào và build file JAR (bỏ qua chạy thử test để build nhanh hơn)
COPY src ./src
RUN mvn clean package -DskipTests

# === STAGE 2: Chạy ứng dụng với JRE 21 tinh giản ===
# Sử dụng Eclipse Temurin JRE 21 Alpine để dung lượng image siêu nhẹ, tiết kiệm RAM cho gói Free
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy file .jar đã build từ Stage 1 sang Stage 2
COPY --from=build /app/target/*.jar app.jar

# Render sẽ cung cấp một cổng PORT ngẫu nhiên thông qua biến môi trường $PORT
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT}"]