package org.jackhuang.hmcl.util;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.Objects;

public final class QuickLaunchConfig {

    private final String id;
    private final String name;
    private final String versionId;
    private final String serverAddress;
    private final String accountName;
    private final int maxMemory;
    private final boolean fullscreen;
    private final String javaPath;
    private final long createdAt;
    private final long lastUsedAt;
    private final int useCount;
    private final String description;

    public QuickLaunchConfig(@NotNull String id, @NotNull String name, @NotNull String versionId) {
        this(id, name, versionId, null, null, 0, false, null, System.currentTimeMillis(), System.currentTimeMillis(), 0, null);
    }

    public QuickLaunchConfig(@NotNull String id, @NotNull String name, @NotNull String versionId,
                             @Nullable String serverAddress) {
        this(id, name, versionId, serverAddress, null, 0, false, null, System.currentTimeMillis(), System.currentTimeMillis(), 0, null);
    }

    public QuickLaunchConfig(@NotNull String id, @NotNull String name, @NotNull String versionId,
                             @Nullable String serverAddress, @Nullable String accountName,
                             int maxMemory, boolean fullscreen, @Nullable String javaPath,
                             long createdAt, long lastUsedAt, int useCount, @Nullable String description) {
        this.id = Objects.requireNonNull(id);
        this.name = Objects.requireNonNull(name);
        this.versionId = Objects.requireNonNull(versionId);
        this.serverAddress = serverAddress;
        this.accountName = accountName;
        this.maxMemory = maxMemory;
        this.fullscreen = fullscreen;
        this.javaPath = javaPath;
        this.createdAt = createdAt;
        this.lastUsedAt = lastUsedAt;
        this.useCount = useCount;
        this.description = description;
    }

    public @NotNull String getId() {
        return id;
    }

    public @NotNull String getName() {
        return name;
    }

    public @NotNull String getVersionId() {
        return versionId;
    }

    public @Nullable String getServerAddress() {
        return serverAddress;
    }

    public @Nullable String getAccountName() {
        return accountName;
    }

    public int getMaxMemory() {
        return maxMemory;
    }

    public boolean isFullscreen() {
        return fullscreen;
    }

    public @Nullable String getJavaPath() {
        return javaPath;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public long getLastUsedAt() {
        return lastUsedAt;
    }

    public int getUseCount() {
        return useCount;
    }

    public @Nullable String getDescription() {
        return description;
    }

    public boolean hasServer() {
        return serverAddress != null && !serverAddress.isEmpty();
    }

    public QuickLaunchConfig withLastUsedAt(long lastUsedAt) {
        return new QuickLaunchConfig(id, name, versionId, serverAddress, accountName, maxMemory,
                fullscreen, javaPath, createdAt, lastUsedAt, useCount + 1, description);
    }

    public QuickLaunchConfig withName(String name) {
        return new QuickLaunchConfig(id, name, versionId, serverAddress, accountName, maxMemory,
                fullscreen, javaPath, createdAt, lastUsedAt, useCount, description);
    }

    public QuickLaunchConfig withServerAddress(String serverAddress) {
        return new QuickLaunchConfig(id, name, versionId, serverAddress, accountName, maxMemory,
                fullscreen, javaPath, createdAt, lastUsedAt, useCount, description);
    }

    public QuickLaunchConfig withMaxMemory(int maxMemory) {
        return new QuickLaunchConfig(id, name, versionId, serverAddress, accountName, maxMemory,
                fullscreen, javaPath, createdAt, lastUsedAt, useCount, description);
    }

    public QuickLaunchConfig withFullscreen(boolean fullscreen) {
        return new QuickLaunchConfig(id, name, versionId, serverAddress, accountName, maxMemory,
                fullscreen, javaPath, createdAt, lastUsedAt, useCount, description);
    }

    public QuickLaunchConfig withJavaPath(String javaPath) {
        return new QuickLaunchConfig(id, name, versionId, serverAddress, accountName, maxMemory,
                fullscreen, javaPath, createdAt, lastUsedAt, useCount, description);
    }

    public QuickLaunchConfig withDescription(String description) {
        return new QuickLaunchConfig(id, name, versionId, serverAddress, accountName, maxMemory,
                fullscreen, javaPath, createdAt, lastUsedAt, useCount, description);
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof QuickLaunchConfig that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("QuickLaunchConfig[id='%s', name='%s', version='%s']", id, name, versionId);
    }

    public static String generateId() {
        return "ql_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000);
    }
}
