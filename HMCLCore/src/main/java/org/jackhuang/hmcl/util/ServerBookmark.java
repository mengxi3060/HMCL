package org.jackhuang.hmcl.util;

import org.jetbrains.annotations.NotNull;

import java.util.Objects;

public final class ServerBookmark {

    private final String name;
    private final String address;
    private final String associatedVersion;
    private final String description;
    private final long createdAt;
    private final long lastUsedAt;
    private final int useCount;

    public ServerBookmark(@NotNull String name, @NotNull String address) {
        this(name, address, null, null);
    }

    public ServerBookmark(@NotNull String name, @NotNull String address, String associatedVersion) {
        this(name, address, associatedVersion, null);
    }

    public ServerBookmark(@NotNull String name, @NotNull String address, String associatedVersion, String description) {
        this(name, address, associatedVersion, description, System.currentTimeMillis(), System.currentTimeMillis(), 0);
    }

    public ServerBookmark(@NotNull String name, @NotNull String address, String associatedVersion, String description,
                          long createdAt, long lastUsedAt, int useCount) {
        this.name = Objects.requireNonNull(name);
        this.address = Objects.requireNonNull(address);
        this.associatedVersion = associatedVersion;
        this.description = description;
        this.createdAt = createdAt;
        this.lastUsedAt = lastUsedAt;
        this.useCount = useCount;
    }

    public @NotNull String getName() {
        return name;
    }

    public @NotNull String getAddress() {
        return address;
    }

    public String getAssociatedVersion() {
        return associatedVersion;
    }

    public String getDescription() {
        return description;
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

    public ServerAddress parseServerAddress() {
        return ServerAddress.parse(address);
    }

    public ServerBookmark withLastUsedAt(long lastUsedAt) {
        return new ServerBookmark(name, address, associatedVersion, description, createdAt, lastUsedAt, useCount + 1);
    }

    public ServerBookmark withAssociatedVersion(String associatedVersion) {
        return new ServerBookmark(name, address, associatedVersion, description, createdAt, lastUsedAt, useCount);
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof ServerBookmark that)) return false;
        return Objects.equals(name, that.name) && Objects.equals(address, that.address);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, address);
    }

    @Override
    public String toString() {
        return String.format("ServerBookmark[name='%s', address='%s']", name, address);
    }
}
