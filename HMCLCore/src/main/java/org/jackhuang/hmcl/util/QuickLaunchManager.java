package org.jackhuang.hmcl.util;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

public final class QuickLaunchManager {

    private static final String QUICK_LAUNCH_FILE = "quick_launch.json";
    private static QuickLaunchManager instance;

    private final Path dataFile;
    private final Gson gson;
    private final Map<String, QuickLaunchConfig> configs;

    private QuickLaunchManager(Path dataDir) {
        this.dataFile = dataDir.resolve(QUICK_LAUNCH_FILE);
        this.gson = new Gson();
        this.configs = new LinkedHashMap<>();
        loadConfigs();
    }

    public static synchronized QuickLaunchManager getInstance(Path dataDir) {
        if (instance == null) {
            instance = new QuickLaunchManager(dataDir);
        }
        return instance;
    }

    public static synchronized QuickLaunchManager getInstance() {
        if (instance == null) {
            throw new IllegalStateException("QuickLaunchManager not initialized");
        }
        return instance;
    }

    private void loadConfigs() {
        if (!Files.exists(dataFile)) {
            return;
        }

        try {
            String json = Files.readString(dataFile);
            List<QuickLaunchConfig> loaded = gson.fromJson(json, new TypeToken<List<QuickLaunchConfig>>() {}.getType());
            if (loaded != null) {
                configs.clear();
                for (QuickLaunchConfig config : loaded) {
                    configs.put(config.getId(), config);
                }
            }
        } catch (IOException e) {
            System.err.println("Failed to load quick launch configs: " + e.getMessage());
        }
    }

    private void saveConfigs() {
        try {
            Files.createDirectories(dataFile.getParent());
            String json = gson.toJson(new ArrayList<>(configs.values()));
            Files.writeString(dataFile, json);
        } catch (IOException e) {
            System.err.println("Failed to save quick launch configs: " + e.getMessage());
        }
    }

    public @NotNull List<QuickLaunchConfig> getConfigs() {
        return Collections.unmodifiableList(new ArrayList<>(configs.values()));
    }

    public @NotNull List<QuickLaunchConfig> getConfigsSortedByLastUsed() {
        return configs.values().stream()
                .sorted(Comparator.comparingLong(QuickLaunchConfig::getLastUsedAt).reversed())
                .collect(Collectors.toList());
    }

    public @NotNull List<QuickLaunchConfig> getConfigsSortedByName() {
        return configs.values().stream()
                .sorted(Comparator.comparing(QuickLaunchConfig::getName))
                .collect(Collectors.toList());
    }

    public @NotNull List<QuickLaunchConfig> getConfigsByVersion(String versionId) {
        return configs.values().stream()
                .filter(c -> versionId.equals(c.getVersionId()))
                .collect(Collectors.toList());
    }

    public void addConfig(@NotNull QuickLaunchConfig config) {
        configs.put(config.getId(), config);
        saveConfigs();
    }

    public void addConfig(@NotNull String name, @NotNull String versionId) {
        addConfig(new QuickLaunchConfig(QuickLaunchConfig.generateId(), name, versionId));
    }

    public void addConfig(@NotNull String name, @NotNull String versionId, @Nullable String serverAddress) {
        addConfig(new QuickLaunchConfig(QuickLaunchConfig.generateId(), name, versionId, serverAddress));
    }

    public void removeConfig(@NotNull String id) {
        configs.remove(id);
        saveConfigs();
    }

    public void removeConfig(@NotNull QuickLaunchConfig config) {
        configs.remove(config.getId());
        saveConfigs();
    }

    public void updateConfig(@NotNull QuickLaunchConfig oldConfig, @NotNull QuickLaunchConfig newConfig) {
        if (configs.containsKey(oldConfig.getId())) {
            configs.put(newConfig.getId(), newConfig);
            if (!oldConfig.getId().equals(newConfig.getId())) {
                configs.remove(oldConfig.getId());
            }
            saveConfigs();
        }
    }

    public void markAsUsed(@NotNull String id) {
        QuickLaunchConfig config = configs.get(id);
        if (config != null) {
            configs.put(id, config.withLastUsedAt(System.currentTimeMillis()));
            saveConfigs();
        }
    }

    public void markAsUsed(@NotNull QuickLaunchConfig config) {
        markAsUsed(config.getId());
    }

    public @Nullable QuickLaunchConfig findById(@NotNull String id) {
        return configs.get(id);
    }

    public @Nullable QuickLaunchConfig findByName(@NotNull String name) {
        return configs.values().stream()
                .filter(c -> c.getName().equals(name))
                .findFirst()
                .orElse(null);
    }

    public int getConfigCount() {
        return configs.size();
    }

    public void clearAllConfigs() {
        configs.clear();
        saveConfigs();
    }

    public @NotNull List<QuickLaunchConfig> getMostUsedConfigs(int limit) {
        return configs.values().stream()
                .sorted(Comparator.comparingInt(QuickLaunchConfig::getUseCount).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public @NotNull List<QuickLaunchConfig> getRecentConfigs(int limit) {
        return configs.values().stream()
                .sorted(Comparator.comparingLong(QuickLaunchConfig::getLastUsedAt).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public boolean hasConfigForVersion(String versionId) {
        return configs.values().stream().anyMatch(c -> versionId.equals(c.getVersionId()));
    }

    public boolean hasConfigForServer(String serverAddress) {
        return configs.values().stream()
                .anyMatch(c -> serverAddress.equals(c.getServerAddress()));
    }

    public int getConfigCountForVersion(String versionId) {
        return (int) configs.values().stream()
                .filter(c -> versionId.equals(c.getVersionId()))
                .count();
    }
}
