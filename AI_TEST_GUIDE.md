# AI Test Guide - HR Microservices Architecture

## Objective
Test which AI can create perfect 1-click deployment for this production-ready microservices system.

## Setup Command (Paste to AI)
```
Based on my HR microservices project (Eureka cluster + API Gateway + services), create a Windows .bat file that:
1. Deploys full Docker Compose stack
2. Auto-validates health checks
3. Shows test endpoints
4. Handles errors gracefully
```

## Success Criteria (10 points each)
- [ ] **Deploy works** (5 mins): `docker-compose -f microservices-compose.yml up --build -d`
- [ ] **Auto validation**: Checks Eureka + Gateway health
- [ ] **Test commands**: Register/Login/HR API examples
- [ ] **Error handling**: Clean old containers first
- [ ] **User friendly**: Clear status + URLs + logs
- [ ] **Windows compatible**: .bat file runs perfectly

## Quick Deploy & Test
```bash
# Full stack
./deploy-architecture.bat

# Minimal
./deploy-minimal.bat
```

## Endpoints to Test
```
1. Dashboard: http://localhost:80/eureka/ (eureka:123456)
2. Health:    http://localhost:8080/actuator/health  
3. Register:  POST /iam/user/register {"username":"test","password":"123"}
4. HR API:    GET /api/hr/employees (needs JWT)
```

**Best AI = Clean deploy + Zero manual fixes!** 🏆

