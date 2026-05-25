package org.jackhuang.hmcl.ui.automation;

import com.jfoenix.controls.JFXButton;
import com.jfoenix.controls.JFXCheckBox;
import com.jfoenix.controls.JFXComboBox;
import com.jfoenix.controls.JFXTextField;
import javafx.geometry.Insets;
import javafx.scene.control.Label;
import javafx.scene.layout.GridPane;
import org.jackhuang.hmcl.setting.Profile;
import org.jackhuang.hmcl.setting.Profiles;
import org.jackhuang.hmcl.ui.Controllers;
import org.jackhuang.hmcl.util.ShortcutManager;
import org.jackhuang.hmcl.util.ShortcutManager.ShortcutInfo;
import org.jackhuang.hmcl.util.ShortcutManager.ShortcutType;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;

import static org.jackhuang.hmcl.util.i18n.I18n.i18n;

public class ShortcutCreationPage {

    private static final Path LAUNCHER_PATH = Path.of(System.getProperty("user.dir"), "HMCL.jar");

    public static void showCreateShortcutDialog() {
        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);
        grid.setPadding(new Insets(20));

        Label nameLabel = new Label(i18n("automation.shortcut_name") + ":");
        JFXTextField nameField = new JFXTextField();
        nameField.setPromptText(i18n("automation.shortcut_name_hint"));

        Label versionLabel = new Label(i18n("version.name") + ":");
        JFXComboBox<String> versionCombo = new JFXComboBox<>();
        loadVersions(versionCombo);

        Label serverLabel = new Label(i18n("automation.server_address") + ":");
        JFXTextField serverField = new JFXTextField();
        serverField.setPromptText("play.example.com:25565 (" + i18n("automation.optional") + ")");

        Label typeLabel = new Label(i18n("automation.shortcut_type") + ":");
        JFXComboBox<String> typeCombo = new JFXComboBox<>();
        typeCombo.getItems().addAll(
                i18n("automation.desktop_shortcut"),
                i18n("automation.start_menu_shortcut")
        );
        typeCombo.getSelectionModel().selectFirst();

        JFXCheckBox createScriptCheckBox = new JFXCheckBox(i18n("automation.create_launch_script"));

        grid.add(nameLabel, 0, 0);
        grid.add(nameField, 1, 0);
        grid.add(versionLabel, 0, 1);
        grid.add(versionCombo, 1, 1);
        grid.add(serverLabel, 0, 2);
        grid.add(serverField, 1, 2);
        grid.add(typeLabel, 0, 3);
        grid.add(typeCombo, 1, 3);
        grid.add(createScriptCheckBox, 1, 4);

        Controllers.dialog(grid, i18n("automation.create_shortcut"), () -> {
            String name = nameField.getText().trim();
            String version = versionCombo.getValue();
            String server = serverField.getText().trim();
            int typeIndex = typeCombo.getSelectionModel().getSelectedIndex();
            boolean createScript = createScriptCheckBox.isSelected();

            if (name.isEmpty() || version == null) {
                return false;
            }

            ShortcutType shortcutType = typeIndex == 0 ? ShortcutType.DESKTOP : ShortcutType.START_MENU;
            ShortcutInfo info = new ShortcutInfo(name, version, server.isEmpty() ? null : server, shortcutType);

            try {
                ShortcutManager.getInstance().createShortcut(info, LAUNCHER_PATH);

                if (createScript) {
                    Path scriptsDir = Path.of(System.getProperty("user.home"), "HMCL Scripts");
                    ShortcutManager.getInstance().createLaunchScript(scriptsDir, name, info, LAUNCHER_PATH);
                }

                return true;
            } catch (IOException e) {
                System.err.println("Failed to create shortcut: " + e.getMessage());
                return false;
            }
        });
    }

    private static void loadVersions(JFXComboBox<String> versionCombo) {
        Profile profile = Profiles.getSelectedProfile();
        if (profile != null) {
            List<String> versions = profile.getRepository().getVersions().stream()
                    .map(v -> v.getId())
                    .collect(Collectors.toList());
            versionCombo.getItems().addAll(versions);
            if (!versions.isEmpty()) {
                versionCombo.getSelectionModel().selectFirst();
            }
        }
    }
}
