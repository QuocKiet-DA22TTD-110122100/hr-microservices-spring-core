package microservices.kms.config;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class TwoLevelCacheManager implements CacheManager {

    private final CacheManager l1CacheManager;
    private final CacheManager l2CacheManager;
    private final Set<String> cacheNames;
    private final MeterRegistry meterRegistry;
    private final Map<String, Cache> twoLevelCaches = new ConcurrentHashMap<>();

    public TwoLevelCacheManager(CacheManager l1CacheManager, CacheManager l2CacheManager, Set<String> cacheNames,
                                MeterRegistry meterRegistry) {
        this.l1CacheManager = l1CacheManager;
        this.l2CacheManager = l2CacheManager;
        this.cacheNames = cacheNames;
        this.meterRegistry = meterRegistry;
    }

    @Override
    public Cache getCache(String name) {
        if (!cacheNames.contains(name)) {
            return null;
        }

        return twoLevelCaches.computeIfAbsent(name, cacheName -> {
            Cache l1 = l1CacheManager.getCache(cacheName);
            Cache l2 = l2CacheManager.getCache(cacheName);
            if (l1 == null || l2 == null) {
                return null;
            }
            return new TwoLevelCache(cacheName, l1, l2, meterRegistry);
        });
    }

    @Override
    public Collection<String> getCacheNames() {
        return Collections.unmodifiableSet(cacheNames);
    }
}
