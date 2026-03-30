package com.thuctap2026.auth.iam.sync;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class UserSyncScheduler {

    private final UserSyncService userSyncService;

    public UserSyncScheduler(UserSyncService userSyncService) {
        this.userSyncService = userSyncService;
    }

    @Scheduled(fixedDelayString = "${sync.hr.fixed-delay-ms:5000}")
    public void syncUsersToHr() {
        userSyncService.processReadySyncs();
    }
}
