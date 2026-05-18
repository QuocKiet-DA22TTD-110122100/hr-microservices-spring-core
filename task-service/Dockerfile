FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY target/task-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8087

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
