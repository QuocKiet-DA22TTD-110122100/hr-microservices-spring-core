FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY target/project-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8084

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
