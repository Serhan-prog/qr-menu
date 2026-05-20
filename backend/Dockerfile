FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B
COPY src src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN groupadd --system qrmenu && useradd --system --gid qrmenu --home-dir /app qrmenu
COPY --from=build /app/target/*.jar app.jar
RUN chown -R qrmenu:qrmenu /app
USER qrmenu
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
