package org.jackhuang.hmcl.util;

import org.jackhuang.hmcl.util.platform.OperatingSystem;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

public final class ShortcutManager {

    public enum ShortcutType {
        DESKTOP,
        START_MENU,
        QUICK_LAUNCH
    }

    public static class ShortcutInfo {
        private final String name;
        private final String versionId;
        private final String serverAddress;
        private final ShortcutType type;

        public ShortcutInfo(String name, String versionId, String serverAddress, ShortcutType type) {
            this.name = name;
            this.versionId = versionId;
            this.serverAddress = serverAddress;
            this.type = type;
        }

        public String getName() {
            return name;
        }

        public String getVersionId() {
            return versionId;
        }

        public String getServerAddress() {
            return serverAddress;
        }

        public ShortcutType getType() {
            return type;
        }
    }

    private static ShortcutManager instance;

    private ShortcutManager() {
    }

    public static synchronized ShortcutManager getInstance() {
        if (instance == null) {
            instance = new ShortcutManager();
        }
        return instance;
    }

    public Path getDesktopDirectory() {
        String userHome = System.getProperty("user.home");
        String desktop;

        switch (OperatingSystem.CURRENT_OS) {
            case WINDOWS:
                desktop = System.getenv("USERPROFILE") + "\\Desktop";
                break;
            case MACOS:
                desktop = userHome + "/Desktop";
                break;
            default:
                desktop = userHome + "/桌面";
                break;
        }

        return Path.of(desktop);
    }

    public Path getStartMenuDirectory() {
        String userHome = System.getProperty("user.home");

        switch (OperatingSystem.CURRENT_OS) {
            case WINDOWS:
                return Path.of(System.getenv("APPDATA"), "Microsoft", "Windows", "Start Menu", "Programs");
            case MACOS:
                return Path.of(userHome, "Library", "Application Support", "Dock", "q");
            default:
                return Path.of(userHome, ".local", "share", "applications");
        }
    }

    public boolean createShortcut(ShortcutInfo info, Path launcherPath) throws IOException {
        String fileName = sanitizeFileName(info.getName());

        switch (info.getType()) {
            case DESKTOP:
                return createDesktopShortcut(info, launcherPath, fileName);
            case START_MENU:
                return createStartMenuShortcut(info, launcherPath, fileName);
            default:
                return false;
        }
    }

    private String sanitizeFileName(String name) {
        return name.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    private boolean createDesktopShortcut(ShortcutInfo info, Path launcherPath, String fileName) throws IOException {
        Path desktopDir = getDesktopDirectory();
        Files.createDirectories(desktopDir);

        switch (OperatingSystem.CURRENT_OS) {
            case WINDOWS:
                return createWindowsShortcut(desktopDir.resolve(fileName + ".lnk"), info, launcherPath);
            case MACOS:
                return createMacOSAlias(desktopDir.resolve(fileName + ".command"), info, launcherPath);
            default:
                return createLinuxDesktopFile(desktopDir.resolve(fileName + ".desktop"), info, launcherPath);
        }
    }

    private boolean createStartMenuShortcut(ShortcutInfo info, Path launcherPath, String fileName) throws IOException {
        Path startMenuDir = getStartMenuDirectory();
        Files.createDirectories(startMenuDir);

        switch (OperatingSystem.CURRENT_OS) {
            case WINDOWS:
                return createWindowsShortcut(startMenuDir.resolve(fileName + ".lnk"), info, launcherPath);
            case MACOS:
                return createMacOSAlias(startMenuDir.resolve(fileName + ".command"), info, launcherPath);
            default:
                return createLinuxDesktopFile(startMenuDir.resolve(fileName + ".desktop"), info, launcherPath);
        }
    }

    private boolean createWindowsShortcut(Path shortcutPath, ShortcutInfo info, Path launcherPath) throws IOException {
        StringBuilder bat = new StringBuilder();
        bat.append("@echo off\n");
        bat.append("cd /d \"").append(launcherPath.getParent()).append("\"\n");

        if (info.getServerAddress() != null && !info.getServerAddress().isEmpty()) {
            bat.append("\"").append(launcherPath).append("\" --quick-play-multiplayer \"").append(info.getServerAddress()).append("\" \"").append(info.getVersionId()).append("\"\n");
        } else {
            bat.append("\"").append(launcherPath).append("\" \"").append(info.getVersionId()).append("\"\n");
        }

        bat.append("pause\n");

        Files.writeString(shortcutPath.resolveSibling(shortcutPath.getFileName().toString().replace(".lnk", ".bat")), bat.toString());
        return true;
    }

    private boolean createMacOSAlias(Path scriptPath, ShortcutInfo info, Path launcherPath) throws IOException {
        StringBuilder script = new StringBuilder();
        script.append("#!/bin/bash\n");
        script.append("cd \"").append(launcherPath.getParent()).append("\"\n");

        if (info.getServerAddress() != null && !info.getServerAddress().isEmpty()) {
            script.append("\"").append(launcherPath).append("\" --quick-play-multiplayer \"").append(info.getServerAddress()).append("\" \"").append(info.getVersionId()).append("\"\n");
        } else {
            script.append("\"").append(launcherPath).append("\" \"").append(info.getVersionId()).append("\"\n");
        }

        Files.writeString(scriptPath, script.toString());
        scriptPath.toFile().setExecutable(true);
        return true;
    }

    private boolean createLinuxDesktopFile(Path desktopFile, ShortcutInfo info, Path launcherPath) throws IOException {
        StringBuilder desktop = new StringBuilder();
        desktop.append("[Desktop Entry]\n");
        desktop.append("Type=Application\n");
        desktop.append("Name=").append(info.getName()).append("\n");
        desktop.append("Exec=\"").append(launcherPath).append("\" \"").append(info.getVersionId()).append("\"");
        if (info.getServerAddress() != null && !info.getServerAddress().isEmpty()) {
            desktop.append(" --quick-play-multiplayer \"").append(info.getServerAddress()).append("\"");
        }
        desktop.append("\n");
        desktop.append("Icon=minecraft\n");
        desktop.append("Terminal=false\n");
        desktop.append("Categories=Game;\n");

        Files.writeString(desktopFile, desktop.toString());
        desktopFile.toFile().setExecutable(true);
        return true;
    }

    public Path createLaunchScript(Path outputDir, String scriptName, ShortcutInfo info, Path launcherPath) throws IOException {
        Files.createDirectories(outputDir);
        String fileName = sanitizeFileName(scriptName);

        switch (OperatingSystem.CURRENT_OS) {
            case WINDOWS:
                Path batFile = outputDir.resolve(fileName + ".bat");
                StringBuilder bat = new StringBuilder();
                bat.append("@echo off\n");
                bat.append("cd /d \"").append(launcherPath.getParent()).append("\"\n");

                if (info.getServerAddress() != null && !info.getServerAddress().isEmpty()) {
                    bat.append("\"").append(launcherPath).append("\" --quick-play-multiplayer \"").append(info.getServerAddress()).append("\" \"").append(info.getVersionId()).append("\"\n");
                } else {
                    bat.append("\"").append(launcherPath).append("\" \"").append(info.getVersionId()).append("\"\n");
                }

                bat.append("pause\n");

                Files.writeString(batFile, bat.toString());
                return batFile;

            case MACOS:
                Path commandFile = outputDir.resolve(fileName + ".command");
                StringBuilder command = new StringBuilder();
                command.append("#!/bin/bash\n");
                command.append("cd \"").append(launcherPath.getParent()).append("\"\n");

                if (info.getServerAddress() != null && !info.getServerAddress().isEmpty()) {
                    command.append("\"").append(launcherPath).append("\" --quick-play-multiplayer \"").append(info.getServerAddress()).append("\" \"").append(info.getVersionId()).append("\"\n");
                } else {
                    command.append("\"").append(launcherPath).append("\" \"").append(info.getVersionId()).append("\"\n");
                }

                Files.writeString(commandFile, command.toString());
                commandFile.toFile().setExecutable(true);
                return commandFile;

            default:
                Path shFile = outputDir.resolve(fileName + ".sh");
                StringBuilder sh = new StringBuilder();
                sh.append("#!/bin/bash\n");
                sh.append("cd \"").append(launcherPath.getParent()).append("\"\n");

                if (info.getServerAddress() != null && !info.getServerAddress().isEmpty()) {
                    sh.append("\"").append(launcherPath).append("\" --quick-play-multiplayer \"").append(info.getServerAddress()).append("\" \"").append(info.getVersionId()).append("\"\n");
                } else {
                    sh.append("\"").append(launcherPath).append("\" \"").append(info.getVersionId()).append("\"\n");
                }

                Files.writeString(shFile, sh.toString());
                shFile.toFile().setExecutable(true);
                return shFile;
        }
    }

    public Map<String, Object> getShortcutMetadata(ShortcutInfo info) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("name", info.getName());
        metadata.put("versionId", info.getVersionId());
        metadata.put("serverAddress", info.getServerAddress() != null ? info.getServerAddress() : "");
        metadata.put("type", info.getType().name());
        metadata.put("createdAt", System.currentTimeMillis());
        return metadata;
    }
}
