FROM maven:3.9.6-eclipse-temurin-17
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -jar $(find /app/target -name \"*.jar\" | head -1)"]
