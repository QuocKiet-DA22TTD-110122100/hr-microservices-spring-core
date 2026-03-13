# Implementation Plan: Eureka System Functions

## Overview

Triển khai hệ thống Eureka Server Cluster với 3 nodes để cung cấp service registry và discovery cho kiến trúc microservices. Hệ thống sẽ được xây dựng bằng Java Spring Boot với đầy đủ các tính năng high availability, peer replication, self-preservation mode, và security.

## Tasks

- [x] 1. Thiết lập project structure và core interfaces
  - Tạo Maven project với Spring Boot starter
  - Định nghĩa core interfaces và data models
  - Cấu hình dependencies và build configuration
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Implement Service Registry Core
  - [x] 2.1 Tạo InstanceInfo và Application data models
    - Tạo file `src/main/java/com/eureka/model/InstanceInfo.java`
    - Tạo file `src/main/java/com/eureka/model/Application.java`
    - Tạo file `src/main/java/com/eureka/model/LeaseInfo.java`
    - Implement validation logic và serialization
    - _Requirements: 1.2, 2.5_

  - [ ]* 2.2 Write property test for data model validation
    - **Property 2: Registration Validation**
    - **Validates: Requirements 1.2, 1.5**

  - [x] 2.3 Implement ServiceRegistry interface và AbstractInstanceRegistry
    - Tạo file `src/main/java/com/eureka/registry/ServiceRegistry.java`
    - Tạo file `src/main/java/com/eureka/registry/AbstractInstanceRegistry.java`
    - Implement registry operations (register, deregister, renew)
    - _Requirements: 1.1, 1.3, 3.2_

  - [ ]* 2.4 Write property test for registry operations
    - **Property 1: Service Registration Round Trip**
    - **Validates: Requirements 1.1, 1.3, 1.4**

- [x] 3. Implement REST API Controllers
  - [x] 3.1 Tạo ApplicationController cho service registration
    - Tạo file `src/main/java/com/eureka/controller/ApplicationController.java`
    - Implement POST /eureka/apps/{appName} endpoint
    - Implement PUT /eureka/apps/{appName}/{instanceId} endpoint
    - Implement DELETE /eureka/apps/{appName}/{instanceId} endpoint
    - _Requirements: 1.1, 1.3, 1.5_

  - [x] 3.2 Tạo DiscoveryController cho service discovery
    - Tạo file `src/main/java/com/eureka/controller/DiscoveryController.java`
    - Implement GET /eureka/apps endpoint
    - Implement GET /eureka/apps/{appName} endpoint
    - Implement GET /eureka/apps/delta endpoint
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.3 Write property test for service discovery
    - **Property 3: Service Discovery Filtering**
    - **Validates: Requirements 2.1, 2.4**

  - [ ]* 3.4 Write property test for metadata completeness
    - **Property 4: Service Discovery Metadata Completeness**
    - **Validates: Requirements 2.5, 6.1, 6.3**

- [x] 4. Checkpoint - Ensure basic registry functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Health Monitoring System
  - [ ] 5.1 Tạo HealthCheckManager và HeartbeatProcessor
    - Tạo file `src/main/java/com/eureka/health/HealthCheckManager.java`
    - Tạo file `src/main/java/com/eureka/health/HeartbeatProcessor.java`
    - Implement scheduled health checks và heartbeat processing
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 5.2 Implement lease management và eviction logic
    - Tạo file `src/main/java/com/eureka/lease/LeaseManager.java`
    - Implement automatic instance eviction sau 90 giây
    - Implement lease renewal logic
    - _Requirements: 3.2, 3.5_

  - [ ]* 5.3 Write property test for heartbeat timeout handling
    - **Property 6: Heartbeat Timeout Handling**
    - **Validates: Requirements 3.2, 3.5**

  - [ ]* 5.4 Write property test for health check status updates
    - **Property 7: Health Check Status Updates**
    - **Validates: Requirements 3.3, 3.4**

- [ ] 6. Implement Peer Replication System
  - [ ] 6.1 Tạo PeerEurekaNode và PeerReplicationManager
    - Tạo file `src/main/java/com/eureka/peer/PeerEurekaNode.java`
    - Tạo file `src/main/java/com/eureka/peer/PeerReplicationManager.java`
    - Implement HTTP replication client với retry logic
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 6.2 Implement PeerAwareInstanceRegistry
    - Tạo file `src/main/java/com/eureka/registry/PeerAwareInstanceRegistry.java`
    - Extend AbstractInstanceRegistry với peer replication
    - Implement replication prevention loops
    - _Requirements: 4.1, 4.3, 4.5_

  - [ ] 6.3 Implement startup synchronization logic
    - Tạo method syncUp() trong PeerReplicationManager
    - Implement full registry sync khi khởi động
    - _Requirements: 4.4_

  - [ ]* 6.4 Write property test for peer replication consistency
    - **Property 8: Peer Replication Consistency**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

  - [ ]* 6.5 Write property test for startup synchronization
    - **Property 9: Startup Synchronization**
    - **Validates: Requirements 4.4**

- [ ] 7. Implement Self-Preservation Mode
  - [ ] 7.1 Tạo SelfPreservationModeManager
    - Tạo file `src/main/java/com/eureka/selfpreservation/SelfPreservationModeManager.java`
    - Implement renewal threshold calculation
    - Implement self-preservation mode transitions
    - _Requirements: 5.1, 5.3, 5.5_

  - [ ] 7.2 Integrate self-preservation với eviction logic
    - Modify HeartbeatProcessor để respect self-preservation mode
    - Implement logging cho mode changes
    - _Requirements: 5.2, 5.4_

  - [ ]* 7.3 Write property test for self-preservation transitions
    - **Property 10: Self-Preservation Mode Transitions**
    - **Validates: Requirements 5.1, 5.3, 5.5**

  - [ ]* 7.4 Write property test for self-preservation behavior
    - **Property 11: Self-Preservation Behavior**
    - **Validates: Requirements 5.2, 5.4**

- [ ] 8. Checkpoint - Ensure core functionality is complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Load Balancing Support
  - [ ] 9.1 Enhance DiscoveryController với zone-aware filtering
    - Modify existing DiscoveryController
    - Add zone filtering parameters
    - Implement instance ordering consistency
    - _Requirements: 6.2, 6.4, 6.5_

  - [ ] 9.2 Add metadata support cho load balancing
    - Enhance InstanceInfo với weight và zone information
    - Implement metadata validation
    - _Requirements: 6.1, 6.3_

  - [ ]* 9.3 Write property test for zone-aware load balancing
    - **Property 12: Zone-Aware Load Balancing**
    - **Validates: Requirements 6.2, 6.4, 6.5**

- [ ] 10. Implement Security và Authentication
  - [ ] 10.1 Tạo EurekaSecurityConfig
    - Tạo file `src/main/java/com/eureka/security/EurekaSecurityConfig.java`
    - Implement HTTP Basic Authentication
    - Configure SSL certificate validation
    - _Requirements: 7.1, 7.2_

  - [ ] 10.2 Tạo IpWhitelistFilter
    - Tạo file `src/main/java/com/eureka/security/IpWhitelistFilter.java`
    - Implement IP whitelist validation
    - Support CIDR notation
    - _Requirements: 7.3_

  - [ ] 10.3 Add authentication failure logging
    - Enhance security components với detailed logging
    - _Requirements: 7.4_

  - [ ]* 10.4 Write property test for security enforcement
    - **Property 13: Security Enforcement**
    - **Validates: Requirements 7.2, 7.3, 7.5**

  - [ ]* 10.5 Write property test for authentication failure logging
    - **Property 14: Authentication Failure Logging**
    - **Validates: Requirements 7.4**

- [ ] 11. Implement Monitoring và Metrics
  - [ ] 11.1 Tạo EurekaMetrics component
    - Tạo file `src/main/java/com/eureka/metrics/EurekaMetrics.java`
    - Implement Micrometer metrics collection
    - Track registrations, heartbeats, replication metrics
    - _Requirements: 8.2, 8.3, 8.5_

  - [ ] 11.2 Tạo EurekaHealthIndicator
    - Tạo file `src/main/java/com/eureka/health/EurekaHealthIndicator.java`
    - Implement comprehensive health checks
    - Include peer connectivity status
    - _Requirements: 8.4_

  - [ ] 11.3 Configure Actuator endpoints
    - Configure application.yml cho metrics exposure
    - Enable Prometheus metrics export
    - _Requirements: 8.1_

  - [ ]* 11.4 Write property test for metrics tracking accuracy
    - **Property 15: Metrics Tracking Accuracy**
    - **Validates: Requirements 8.2, 8.3, 8.5**

- [ ] 12. Implement Configuration Management
  - [ ] 12.1 Tạo EurekaServerConfigBean
    - Tạo file `src/main/java/com/eureka/config/EurekaServerConfigBean.java`
    - Implement @ConfigurationProperties với validation
    - Support dynamic configuration reload
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 12.2 Add environment profile support
    - Tạo application-peer1.yml, application-peer2.yml, application-peer3.yml
    - Configure profile-specific settings
    - _Requirements: 9.4_

  - [ ] 12.3 Implement configuration validation
    - Add @PostConstruct validation trong config beans
    - Provide meaningful error messages
    - _Requirements: 9.5_

  - [ ]* 12.4 Write property test for dynamic configuration reload
    - **Property 16: Dynamic Configuration Reload**
    - **Validates: Requirements 9.1**

  - [ ]* 12.5 Write property test for configuration validation
    - **Property 17: Configuration Validation and Defaults**
    - **Validates: Requirements 9.2, 9.3, 9.5**

  - [ ]* 12.6 Write property test for environment profile support
    - **Property 18: Environment Profile Support**
    - **Validates: Requirements 9.4**

- [ ] 13. Implement Data Persistence và Recovery
  - [ ] 13.1 Tạo RegistryBackupManager
    - Tạo file `src/main/java/com/eureka/backup/RegistryBackupManager.java`
    - Implement scheduled registry backup to disk
    - Implement backup restoration logic
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 13.2 Add backup retention và cleanup
    - Implement backup file retention policy
    - Handle corrupted backup files gracefully
    - _Requirements: 10.4, 10.5_

  - [ ]* 13.3 Write property test for registry backup and recovery
    - **Property 19: Registry Backup and Recovery**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [ ]* 13.4 Write property test for backup management
    - **Property 20: Backup Management**
    - **Validates: Requirements 10.4, 10.5**

- [ ] 14. Implement Error Handling và Response Cache
  - [ ] 14.1 Tạo GlobalExceptionHandler
    - Tạo file `src/main/java/com/eureka/exception/GlobalExceptionHandler.java`
    - Implement comprehensive error handling
    - Standardize error response format
    - _Requirements: All error scenarios_

  - [ ] 14.2 Implement ResponseCacheImpl
    - Tạo file `src/main/java/com/eureka/cache/ResponseCacheImpl.java`
    - Implement read-only và read-write cache layers
    - Configure cache expiration và update intervals
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 15. Create Main Application và Configuration Files
  - [ ] 15.1 Tạo EurekaServerApplication main class
    - Tạo file `src/main/java/com/eureka/EurekaServerApplication.java`
    - Configure @SpringBootApplication với @EnableEurekaServer
    - _Requirements: All_

  - [ ] 15.2 Tạo application configuration files
    - Tạo file `src/main/resources/application.yml` (main config)
    - Tạo file `src/main/resources/application-peer1.yml`
    - Tạo file `src/main/resources/application-peer2.yml`
    - Tạo file `src/main/resources/application-peer3.yml`
    - _Requirements: All configuration requirements_

  - [ ] 15.3 Tạo Maven pom.xml
    - Configure Spring Boot parent và dependencies
    - Add Netflix Eureka, Spring Security, Micrometer dependencies
    - Configure build plugins
    - _Requirements: All_

- [ ] 16. Create Docker và Deployment Configuration
  - [ ] 16.1 Tạo Dockerfile
    - Tạo file `Dockerfile` trong project root
    - Configure multi-stage build với security best practices
    - _Requirements: Deployment_

  - [ ] 16.2 Tạo Docker Compose configuration
    - Tạo file `docker-compose.yml`
    - Configure 3-node Eureka cluster với HAProxy load balancer
    - _Requirements: Deployment_

  - [ ] 16.3 Tạo Kubernetes deployment files
    - Tạo file `k8s/eureka-configmap.yaml`
    - Tạo file `k8s/eureka-deployment.yaml`
    - Tạo file `k8s/eureka-service.yaml`
    - _Requirements: Deployment_

  - [ ] 16.4 Tạo HAProxy configuration
    - Tạo file `haproxy/haproxy.cfg`
    - Configure load balancing với health checks
    - _Requirements: Load balancing_

- [ ] 17. Final Integration và Testing
  - [ ] 17.1 Wire tất cả components together
    - Ensure tất cả beans được properly configured
    - Verify dependency injection hoạt động correctly
    - Test end-to-end functionality
    - _Requirements: All_

  - [ ]* 17.2 Write integration tests
    - Test full cluster startup và peer discovery
    - Test service registration và discovery workflows
    - Test failover scenarios
    - _Requirements: All_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked với `*` là optional và có thể skip để faster MVP
- Mỗi task references specific requirements để traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples và edge cases
- Project structure follows Spring Boot best practices
- Configuration supports both Docker và Kubernetes deployment