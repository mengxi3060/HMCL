package org.jackhuang.hmcl.ui.automation;

import com.jfoenix.controls.JFXButton;
import com.jfoenix.controls.JFXListView;
import com.jfoenix.controls.JFXTextField;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Label;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import org.jackhuang.hmcl.ui.Controllers;
import org.jackhuang.hmcl.util.QuickLaunchConfig;
import org.jackhuang.hmcl.util.QuickLaunchManager;

import java.util.List;
import java.util.stream.Collectors;

import static org.jackhuang.hmcl.util.i18n.I18n.i18n;

public class QuickLaunchPage extends VBox {

    private final JFXListView<QuickLaunchConfig> listView;
    private final JFXButton addButton;
    private final JFXButton removeButton;
    private final JFXButton editButton;
    private final JFXButton launchButton;

    public QuickLaunchPage() {
        setSpacing(0);
        setFillWidth(true);

        VBox headerPane = new VBox();
        headerPane.getStyleClass().add("card-title");
        headerPane.setPadding(new Insets(16, 24, 16, 24));

        Label titleLabel = new Label(i18n("automation.quick_launch"));
        titleLabel.getStyleClass().add("title-label");

        HBox buttonBox = new HBox(8);
        buttonBox.setAlignment(Pos.CENTER_RIGHT);

        addButton = new JFXButton("+");
        addButton.getStyleClass().addAll("btn", "btn-primary");
        addButton.setOnAction(e -> showAddDialog());

        editButton = new JFXButton(i18n("button.edit"));
        editButton.getStyleClass().addAll("btn", "btn-secondary");
        editButton.setOnAction(e -> editSelectedConfig());
        editButton.setDisable(true);

        removeButton = new JFXButton(i18n("button.delete"));
        removeButton.getStyleClass().addAll("btn", "btn-danger");
        removeButton.setOnAction(e -> removeSelectedConfig());
        removeButton.setDisable(true);

        launchButton = new JFXButton(i18n("automation.launch"));
        launchButton.getStyleClass().addAll("btn", "btn-primary");
        launchButton.setOnAction(e -> launchSelectedConfig());
        launchButton.setDisable(true);

        buttonBox.getChildren().addAll(addButton, editButton, removeButton, launchButton);

        headerPane.getChildren().addAll(titleLabel, buttonBox);

        listView = new JFXListView<>();
        listView.setExpanded(true);
        listView.getStyleClass().add("card-list");
        VBox.setVgrow(listView, Priority.ALWAYS);

        listView.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            boolean hasSelection = newVal != null;
            editButton.setDisable(!hasSelection);
            removeButton.setDisable(!hasSelection);
            launchButton.setDisable(!hasSelection);
        });

        getChildren().addAll(headerPane, listView);

        loadConfigs();
    }

    private void loadConfigs() {
        List<QuickLaunchConfig> configs = QuickLaunchManager.getInstance().getConfigsSortedByLastUsed();
        listView.getItems().setAll(configs);
    }

    private void showAddDialog() {
        showEditDialog(null);
    }

    private void editSelectedConfig() {
        QuickLaunchConfig selected = listView.getSelectionModel().getSelectedItem();
        if (selected != null) {
            showEditDialog(selected);
        }
    }

    private void showEditDialog(QuickLaunchConfig existing) {
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20));

        Label nameLabel = new Label(i18n("automation.name") + ":");
        JFXTextField nameField = new JFXTextField();
        nameField.setPromptText(i18n("automation.quick_launch_name"));

        Label versionLabel = new Label(i18n("version.name") + ":");
        JFXTextField versionField = new JFXTextField();
        versionField.setPromptText("1.20.1");

        Label serverLabel = new Label(i18n("automation.server_address") + ":");
        JFXTextField serverField = new JFXTextField();
        serverField.setPromptText("play.example.com:25565 (" + i18n("automation.optional") + ")");

        if (existing != null) {
            nameField.setText(existing.getName());
            versionField.setText(existing.getVersionId());
            serverField.setText(existing.getServerAddress() != null ? existing.getServerAddress() : "");
        }

        grid.add(nameLabel, 0, 0);
        grid.add(nameField, 1, 0);
        grid.add(versionLabel, 0, 1);
        grid.add(versionField, 1, 1);
        grid.add(serverLabel, 0, 2);
        grid.add(serverField, 1, 2);

        String title = existing == null ? i18n("automation.add_quick_launch") : i18n("automation.edit_quick_launch");

        Controllers.dialog(grid, title, () -> {
            String name = nameField.getText().trim();
            String version = versionField.getText().trim();
            String server = serverField.getText().trim();

            if (name.isEmpty() || version.isEmpty()) {
                return false;
            }

            QuickLaunchConfig config;
            if (existing == null) {
                config = new QuickLaunchConfig(
                        QuickLaunchConfig.generateId(),
                        name,
                        version,
                        server.isEmpty() ? null : server
                );
                QuickLaunchManager.getInstance().addConfig(config);
            } else {
                config = existing.withName(name)
                        .withServerAddress(server.isEmpty() ? null : server);
                QuickLaunchManager.getInstance().updateConfig(existing, config);
            }

            loadConfigs();
            return true;
        });
    }

    private void removeSelectedConfig() {
        QuickLaunchConfig selected = listView.getSelectionModel().getSelectedItem();
        if (selected != null) {
            QuickLaunchManager.getInstance().removeConfig(selected);
            loadConfigs();
        }
    }

    private void launchSelectedConfig() {
        QuickLaunchConfig selected = listView.getSelectionModel().getSelectedItem();
        if (selected != null) {
            QuickLaunchManager.getInstance().markAsUsed(selected);
            loadConfigs();
        }
    }
}
