# TODO: Thêm các hàm EnhancedRegistryService

## Nhiệm vụ
Thêm tất cả các hàm từ EnhancedRegistryService vào:
1. AbstractInstanceRegistry (mở rộng class hiện có)
2. Tạo class mới EnhancedRegistryService

## Các bước thực hiện:

### Bước 1: Thêm các hàm mới vào AbstractInstanceRegistry
- [ ] 1.1 Thêm isInstanceExpired(String appName, String instanceId)
- [ ] 1.2 Thêm getActiveInstances() 
- [ ] 1.3 Thêm getRegistryHealth()
- [ ] 1.4 Thêm evictExpiredInstances() với @Scheduled
- [ ] 1.5 Thêm forceEviction()
- [ ] 1.6 Thêm getStats()
- [ ] 1.7 Thêm các helper class: RegistryHealth, RegistryStats

### Bước 2: Tạo class mới EnhancedRegistryService
- [ ] 2.1 Tạo class EnhancedRegistryService
- [ ] 2.2 Thêm các hàm register, renewLease, deregister
- [ ] 2.3 Thêm các hàm query và statistics
- [ ] 2.4 Thêm eviction logic với @Scheduled

### Bước 3: Testing
- [ ] 3.1 Kiểm tra compile không có lỗi
- [ ] 3.2 Chạy unit tests

