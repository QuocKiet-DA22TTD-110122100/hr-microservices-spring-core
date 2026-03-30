# Fix /iam/user/register 404 via Gateway

**Status:** Active

1. [x] Add gateway route for /iam/user/** → mock-service (edited YAML)
2. [ ] Restart api-gateway: docker compose -f microservices-compose.yml restart api-gateway
3. [ ] Test POST {{gateway_url}}/iam/user/register (Postman Step 1)
4. [ ] Verify in Eureka dashboard: mock-service instances UP
5. [ ] Complete: Remove TODO or mark done

**Root cause:** Missing gateway route for Postman test path.
