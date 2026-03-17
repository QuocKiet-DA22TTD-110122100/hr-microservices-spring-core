# HAProxy SSL Volume Mount TODO

- [x] 1. Edit microservices-compose.yml to add volume mount for eureka.pem to haproxy service
- [x] 2. Create certs/ directory and generate self-signed eureka.pem
- [x] 3. No update needed to haproxy.cfg (no SSL configured currently)
- [ ] 4. docker compose -f microservices-compose.yml up -d & test HTTPS access to port 8760
- [ ] 5. Mark complete
