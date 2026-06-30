package com.hrservice.kms.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.cache.Cache;
import org.springframework.lang.Nullable;

import java.util.concurrent.Callable;

@SuppressWarnings("null")
public class TwoLevelCache implements Cache {

    private final String name;
    private final Cache l1;
    private final Cache l2;
    private final Counter l1HitCounter;
    private final Counter l1MissCounter;
    private final Counter l2HitCounter;
    private final Counter l2MissCounter;

    public TwoLevelCache(String name, Cache l1, Cache l2, MeterRegistry meterRegistry) {
        this.name = name;
        this.l1 = l1;
        this.l2 = l2;
        this.l1HitCounter = counter(meterRegistry, "l1", "hit");
        this.l1MissCounter = counter(meterRegistry, "l1", "miss");
        this.l2HitCounter = counter(meterRegistry, "l2", "hit");
        this.l2MissCounter = counter(meterRegistry, "l2", "miss");
    }

    private Counter counter(MeterRegistry meterRegistry, String level, String result) {
        return Counter.builder("kms.cache.requests")
                .description("KMS two-level cache requests")
                .tag("cache", name)
                .tag("level", level)
                .tag("result", result)
                .register(meterRegistry);
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public Object getNativeCache() {
        return this;
    }

    @Override
    @Nullable
    public ValueWrapper get(Object key) {
        ValueWrapper l1Value = l1.get(key);
        if (l1Value != null) {
            l1HitCounter.increment();
            return l1Value;
        }
        l1MissCounter.increment();

        ValueWrapper l2Value = l2.get(key);
        if (l2Value != null) {
            l2HitCounter.increment();
            l1.put(key, l2Value.get());
        } else {
            l2MissCounter.increment();
        }
        return l2Value;
    }

    @Override
    @Nullable
    public <T> T get(Object key, @Nullable Class<T> type) {
        T l1Value = l1.get(key, type);
        if (l1Value != null) {
            l1HitCounter.increment();
            return l1Value;
        }
        l1MissCounter.increment();

        T l2Value = l2.get(key, type);
        if (l2Value != null) {
            l2HitCounter.increment();
            l1.put(key, l2Value);
        } else {
            l2MissCounter.increment();
        }
        return l2Value;
    }

    @Override
    @Nullable
    public <T> T get(Object key, Callable<T> valueLoader) {
        T currentValue = get(key, (Class<T>) null);
        if (currentValue != null) {
            return currentValue;
        }

        try {
            T loadedValue = valueLoader.call();
            if (loadedValue != null) {
                put(key, loadedValue);
            }
            return loadedValue;
        } catch (Exception ex) {
            throw new ValueRetrievalException(key, valueLoader, ex);
        }
    }

    @Override
    public void put(Object key, @Nullable Object value) {
        l1.put(key, value);
        l2.put(key, value);
    }

    @Override
    @Nullable
    public ValueWrapper putIfAbsent(Object key, @Nullable Object value) {
        ValueWrapper existing = get(key);
        if (existing == null) {
            put(key, value);
            return null;
        }
        return existing;
    }

    @Override
    public void evict(Object key) {
        l1.evict(key);
        l2.evict(key);
    }

    @Override
    public boolean evictIfPresent(Object key) {
        boolean l1Evicted = l1.evictIfPresent(key);
        boolean l2Evicted = l2.evictIfPresent(key);
        return l1Evicted || l2Evicted;
    }

    @Override
    public void clear() {
        l1.clear();
        l2.clear();
    }

    @Override
    public boolean invalidate() {
        boolean l1Invalidated = l1.invalidate();
        boolean l2Invalidated = l2.invalidate();
        return l1Invalidated || l2Invalidated;
    }
}
