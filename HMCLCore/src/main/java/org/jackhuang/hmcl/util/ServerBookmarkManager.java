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

public final class ServerBookmarkManager {

    private static final String BOOKMARKS_FILE = "server_bookmarks.json";
    private static ServerBookmarkManager instance;

    private final Path dataFile;
    private final Gson gson;
    private final List<ServerBookmark> bookmarks;

    private ServerBookmarkManager(Path dataDir) {
        this.dataFile = dataDir.resolve(BOOKMARKS_FILE);
        this.gson = new Gson();
        this.bookmarks = new ArrayList<>();
        loadBookmarks();
    }

    public static synchronized ServerBookmarkManager getInstance(Path dataDir) {
        if (instance == null) {
            instance = new ServerBookmarkManager(dataDir);
        }
        return instance;
    }

    public static synchronized ServerBookmarkManager getInstance() {
        if (instance == null) {
            throw new IllegalStateException("ServerBookmarkManager not initialized");
        }
        return instance;
    }

    private void loadBookmarks() {
        if (!Files.exists(dataFile)) {
            return;
        }

        try {
            String json = Files.readString(dataFile);
            List<ServerBookmark> loaded = gson.fromJson(json, new TypeToken<List<ServerBookmark>>() {}.getType());
            if (loaded != null) {
                bookmarks.clear();
                bookmarks.addAll(loaded);
            }
        } catch (IOException e) {
            System.err.println("Failed to load server bookmarks: " + e.getMessage());
        }
    }

    private void saveBookmarks() {
        try {
            Files.createDirectories(dataFile.getParent());
            String json = gson.toJson(bookmarks);
            Files.writeString(dataFile, json);
        } catch (IOException e) {
            System.err.println("Failed to save server bookmarks: " + e.getMessage());
        }
    }

    public @NotNull List<ServerBookmark> getBookmarks() {
        return Collections.unmodifiableList(bookmarks);
    }

    public @NotNull List<ServerBookmark> getBookmarksSortedByLastUsed() {
        return bookmarks.stream()
                .sorted(Comparator.comparingLong(ServerBookmark::getLastUsedAt).reversed())
                .collect(Collectors.toList());
    }

    public @NotNull List<ServerBookmark> getBookmarksSortedByName() {
        return bookmarks.stream()
                .sorted(Comparator.comparing(ServerBookmark::getName))
                .collect(Collectors.toList());
    }

    public @NotNull List<ServerBookmark> getBookmarksByVersion(String versionId) {
        return bookmarks.stream()
                .filter(b -> versionId.equals(b.getAssociatedVersion()))
                .collect(Collectors.toList());
    }

    public void addBookmark(@NotNull ServerBookmark bookmark) {
        bookmarks.removeIf(b -> b.getName().equals(bookmark.getName()) && b.getAddress().equals(bookmark.getAddress()));
        bookmarks.add(bookmark);
        saveBookmarks();
    }

    public void addBookmark(@NotNull String name, @NotNull String address) {
        addBookmark(new ServerBookmark(name, address));
    }

    public void addBookmark(@NotNull String name, @NotNull String address, String associatedVersion) {
        addBookmark(new ServerBookmark(name, address, associatedVersion));
    }

    public void removeBookmark(@NotNull String name, @NotNull String address) {
        bookmarks.removeIf(b -> b.getName().equals(name) && b.getAddress().equals(address));
        saveBookmarks();
    }

    public void removeBookmark(@NotNull ServerBookmark bookmark) {
        bookmarks.remove(bookmark);
        saveBookmarks();
    }

    public void updateBookmark(@NotNull ServerBookmark oldBookmark, @NotNull ServerBookmark newBookmark) {
        int index = bookmarks.indexOf(oldBookmark);
        if (index >= 0) {
            bookmarks.set(index, newBookmark);
            saveBookmarks();
        }
    }

    public void markAsUsed(@NotNull ServerBookmark bookmark) {
        int index = bookmarks.indexOf(bookmark);
        if (index >= 0) {
            bookmarks.set(index, bookmark.withLastUsedAt(System.currentTimeMillis()));
            saveBookmarks();
        }
    }

    public @Nullable ServerBookmark findByAddress(@NotNull String address) {
        return bookmarks.stream()
                .filter(b -> b.getAddress().equals(address))
                .findFirst()
                .orElse(null);
    }

    public @Nullable ServerBookmark findByName(@NotNull String name) {
        return bookmarks.stream()
                .filter(b -> b.getName().equals(name))
                .findFirst()
                .orElse(null);
    }

    public boolean hasAddress(@NotNull String address) {
        return bookmarks.stream().anyMatch(b -> b.getAddress().equals(address));
    }

    public int getBookmarkCount() {
        return bookmarks.size();
    }

    public void clearAllBookmarks() {
        bookmarks.clear();
        saveBookmarks();
    }
}
