package org.jackhuang.hmcl.ui.automation;

import com.jfoenix.controls.JFXButton;
import com.jfoenix.controls.JFXDialog;
import com.jfoenix.controls.JFXListView;
import com.jfoenix.controls.JFXTextField;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import org.jackhuang.hmcl.setting.Theme;
import org.jackhuang.hmcl.ui.Controllers;
import org.jackhuang.hmcl.ui.FXUtils;
import org.jackhuang.hmcl.ui.construct.*;
import org.jackhuang.hmcl.ui.decorator.DecoratorPage;
import org.jackhuang.hmcl.util.ServerAddress;
import org.jackhuang.hmcl.util.ServerBookmark;
import org.jackhuang.hmcl.util.ServerBookmarkManager;

import java.util.List;
import java.util.stream.Collectors;

import static org.jackhuang.hmcl.util.i18n.I18n.i18n;

public class ServerBookmarksPage extends VBox implements DecoratorPage {

    private final JFXListView<ServerBookmark> listView;
    private final JFXButton addButton;
    private final JFXButton removeButton;
    private final JFXButton editButton;
    private final JFXButton connectButton;

    public ServerBookmarksPage() {
        setSpacing(0);
        setFillWidth(true);

        VBox headerPane = new VBox();
        headerPane.getStyleClass().add("card-title");
        headerPane.setPadding(new Insets(16, 24, 16, 24));

        Label titleLabel = new Label(i18n("automation.server_bookmarks"));
        titleLabel.getStyleClass().add("title-label");

        HBox buttonBox = new HBox(8);
        buttonBox.setAlignment(Pos.CENTER_RIGHT);

        addButton = new JFXButton("+");
        addButton.getStyleClass().addAll("btn", "btn-primary");
        addButton.setOnAction(e -> showAddDialog());

        editButton = new JFXButton(i18n("button.edit"));
        editButton.getStyleClass().addAll("btn", "btn-secondary");
        editButton.setOnAction(e -> editSelectedBookmark());
        editButton.setDisable(true);

        removeButton = new JFXButton(i18n("button.delete"));
        removeButton.getStyleClass().addAll("btn", "btn-danger");
        removeButton.setOnAction(e -> removeSelectedBookmark());
        removeButton.setDisable(true);

        connectButton = new JFXButton(i18n("automation.connect"));
        connectButton.getStyleClass().addAll("btn", "btn-primary");
        connectButton.setOnAction(e -> connectToServer());
        connectButton.setDisable(true);

        buttonBox.getChildren().addAll(addButton, editButton, removeButton, connectButton);

        headerPane.getChildren().addAll(titleLabel, buttonBox);

        listView = new JFXListView<>();
        listView.setExpanded(true);
        listView.getStyleClass().add("card-list");
        VBox.setVgrow(listView, Priority.ALWAYS);

        listView.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            boolean hasSelection = newVal != null;
            editButton.setDisable(!hasSelection);
            removeButton.setDisable(!hasSelection);
            connectButton.setDisable(!hasSelection);
        });

        getChildren().addAll(headerPane, listView);

        loadBookmarks();
    }

    private void loadBookmarks() {
        List<ServerBookmark> bookmarks = ServerBookmarkManager.getInstance().getBookmarksSortedByLastUsed();
        listView.getItems().setAll(bookmarks);
    }

    private void showAddDialog() {
        showEditDialog(null);
    }

    private void editSelectedBookmark() {
        ServerBookmark selected = listView.getSelectionModel().getSelectedItem();
        if (selected != null) {
            showEditDialog(selected);
        }
    }

    private void showEditDialog(ServerBookmark existing) {
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20));

        Label nameLabel = new Label(i18n("automation.name") + ":");
        JFXTextField nameField = new JFXTextField();
        nameField.setPromptText(i18n("automation.name"));

        Label addressLabel = new Label(i18n("automation.server_address") + ":");
        JFXTextField addressField = new JFXTextField();
        addressField.setPromptText("play.example.com:25565");

        Label versionLabel = new Label(i18n("automation.associated_version") + ":");
        JFXTextField versionField = new JFXTextField();
        versionField.setPromptText(i18n("automation.optional"));

        if (existing != null) {
            nameField.setText(existing.getName());
            addressField.setText(existing.getAddress());
            versionField.setText(existing.getAssociatedVersion() != null ? existing.getAssociatedVersion() : "");
        }

        grid.add(nameLabel, 0, 0);
        grid.add(nameField, 1, 0);
        grid.add(addressLabel, 0, 1);
        grid.add(addressField, 1, 1);
        grid.add(versionLabel, 0, 2);
        grid.add(versionField, 1, 2);

        String title = existing == null ? i18n("automation.add_bookmark") : i18n("automation.edit_bookmark");

        Controllers.dialog(grid, title, () -> {
            String name = nameField.getText().trim();
            String address = addressField.getText().trim();
            String version = versionField.getText().trim();

            if (name.isEmpty() || address.isEmpty()) {
                return false;
            }

            try {
                ServerAddress.parse(address);
            } catch (IllegalArgumentException e) {
                return false;
            }

            ServerBookmark bookmark = new ServerBookmark(
                    name,
                    address,
                    version.isEmpty() ? null : version,
                    existing != null ? existing.getDescription() : null
            );

            if (existing == null) {
                ServerBookmarkManager.getInstance().addBookmark(bookmark);
            } else {
                ServerBookmarkManager.getInstance().updateBookmark(existing, bookmark);
            }

            loadBookmarks();
            return true;
        });
    }

    private void removeSelectedBookmark() {
        ServerBookmark selected = listView.getSelectionModel().getSelectedItem();
        if (selected != null) {
            ServerBookmarkManager.getInstance().removeBookmark(selected);
            loadBookmarks();
        }
    }

    private void connectToServer() {
        ServerBookmark selected = listView.getSelectionModel().getSelectedItem();
        if (selected != null) {
            ServerBookmarkManager.getInstance().markAsUsed(selected);
            loadBookmarks();
        }
    }
}
