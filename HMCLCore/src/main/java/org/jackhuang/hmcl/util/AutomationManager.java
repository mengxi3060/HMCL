package org.jackhuang.hmcl.util;

import org.jetbrains.annotations.Nullable;

import java.nio.file.Path;

public final class AutomationManager {
    private static boolean initialized = false;

    private static Path dataDirectory;

    private AutomationManager() {}

    public static void init(@Nullable Path dataDir) {
        if (initialized) {
            return;
        }

        if (dataDir == null) {
            throw new IllegalArgumentException("Data directory must not be null");
        }

        dataDirectory = dataDir;

        try {
            ServerBookmarkManager.getInstance(dataDir);
            QuickLaunchManager.getInstance(dataDir);
            initialized = true;
        } catch (Exception e) {
            System.err.println("Failed to initialize AutomationManager: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static Path getDataDirectory() {
        return dataDirectory;
    }

    public static boolean isInitialized() {
        return initialized;
    }

    public static void shutdown() {
        initialized = false;
        dataDirectory = null;
    }
}
