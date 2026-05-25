# HMCL 自动化脚本功能开发文档

## 概述

本文档介绍了为 Hello Minecraft! Launcher (HMCL) 新增的自动化脚本功能，包括：
- 服务器书签管理
- 快捷方式管理
- 快速启动配置

## 新增功能

### 1. 服务器书签管理

#### 1.1 ServerBookmark 类
**路径**: `HMCLCore/src/main/java/org/jackhuang/hmcl/util/ServerBookmark.java`

服务器书签用于保存常用的 Minecraft 服务器地址，方便快速连接。

**主要属性**:
- `name`: 书签名称
- `address`: 服务器地址 (如 `play.example.com:25565`)
- `associatedVersion`: 关联的游戏版本
- `description`: 描述信息
- `createdAt`: 创建时间戳
- `lastUsedAt`: 最后使用时间戳
- `useCount`: 使用次数

**主要方法**:
- `parseServerAddress()`: 解析服务器地址为 `ServerAddress` 对象
- `withLastUsedAt()`: 更新最后使用时间并增加使用次数
- `withAssociatedVersion()`: 设置关联的游戏版本

#### 1.2 ServerBookmarkManager 类
**路径**: `HMCLCore/src/main/java/org/jackhuang/hmcl/util/ServerBookmarkManager.java`

管理器类，负责服务器书签的持久化存储和检索。

**主要功能**:
- 书签的增删改查
- 按名称、地址、版本号排序
- 使用统计和最近使用排序
- JSON 格式持久化存储

**使用方法**:
```java
// 初始化管理器
ServerBookmarkManager manager = ServerBookmarkManager.getInstance(dataDir);

// 添加书签
manager.addBookmark("我的服务器", "play.example.com:25565");

// 获取最近使用的书签
List<ServerBookmark> recentBookmarks = manager.getBookmarksSortedByLastUsed();

// 获取特定版本的书签
List<ServerBookmark> versionBookmarks = manager.getBookmarksByVersion("1.20.1");

// 标记为已使用
manager.markAsUsed(bookmark);
```

**存储位置**: `server_bookmarks.json`

### 2. 快捷方式管理

#### 2.1 ShortcutManager 类
**路径**: `HMCLCore/src/main/java/org/jackhuang/hmcl/util/ShortcutManager.java`

管理器类，负责创建桌面快捷方式和启动脚本。

**快捷方式类型**:
- `DESKTOP`: 桌面快捷方式
- `START_MENU`: 开始菜单快捷方式
- `QUICK_LAUNCH`: 快速启动栏

**主要功能**:

1. **创建桌面/开始菜单快捷方式**
   ```java
   ShortcutInfo info = new ShortcutInfo(
       "我的服务器",
       "1.20.1",
       "play.example.com:25565",
       ShortcutType.DESKTOP
   );
   shortcutManager.createShortcut(info, launcherPath);
   ```

2. **创建启动脚本**
   ```java
   Path scriptsDir = Path.of(System.getProperty("user.home"), "HMCL Scripts");
   shortcutManager.createLaunchScript(scriptsDir, "MyServer", info, launcherPath);
   ```

**平台支持**:
- **Windows**: 生成 `.bat` 批处理文件
- **macOS**: 生成 `.command` 脚本文件
- **Linux**: 生成 `.desktop` 文件

**启动脚本支持**:
- 自动包含服务器地址参数
- 自动切换到正确的目录
- 支持快速游戏模式 (`--quick-play-multiplayer`)

### 3. 快速启动配置

#### 3.1 QuickLaunchConfig 类
**路径**: `HMCLCore/src/main/java/org/jackhuang/hmcl/util/QuickLaunchConfig.java`

快速启动配置，用于保存预设的游戏启动参数组合。

**主要属性**:
- `id`: 唯一标识符
- `name`: 配置名称
- `versionId`: 游戏版本 ID
- `serverAddress`: 服务器地址 (可选)
- `accountName`: 账户名称 (可选)
- `maxMemory`: 最大内存 (可选)
- `fullscreen`: 是否全屏 (可选)
- `javaPath`: Java 路径 (可选)
- `useCount`: 使用次数

**主要方法**:
- `hasServer()`: 检查是否配置了服务器
- `withLastUsedAt()`: 更新最后使用时间
- `generateId()`: 生成唯一 ID

#### 3.2 QuickLaunchManager 类
**路径**: `HMCLCore/src/main/java/org/jackhuang/hmcl/util/QuickLaunchManager.java`

管理器类，负责快速启动配置的持久化存储。

**主要功能**:
- 配置的增删改查
- 按名称、使用次数、最后使用时间排序
- 获取最常用和最近的配置
- 统计功能

**使用方法**:
```java
// 初始化管理器
QuickLaunchManager manager = QuickLaunchManager.getInstance(dataDir);

// 添加配置
manager.addConfig("生存服", "1.20.1", "survival.example.com:25565");

// 获取最常用的 5 个配置
List<QuickLaunchConfig> mostUsed = manager.getMostUsedConfigs(5);

// 获取最近的配置
List<QuickLaunchConfig> recent = manager.getRecentConfigs(10);

// 标记为已使用
manager.markAsUsed(configId);
```

**存储位置**: `quick_launch.json`

## UI 组件

### 1. ServerBookmarksPage
**路径**: `HMCL/src/main/java/org/jackhuang/hmcl/ui/automation/ServerBookmarksPage.java`

服务器书签管理页面。

**功能**:
- 显示所有书签列表
- 添加新书签
- 编辑现有书签
- 删除书签
- 快速连接到服务器

### 2. QuickLaunchPage
**路径**: `HMCL/src/main/java/org/jackhuang/hmcl/ui/automation/QuickLaunchPage.java`

快速启动配置管理页面。

**功能**:
- 显示所有快速启动配置
- 添加新配置
- 编辑现有配置
- 删除配置
- 快速启动配置好的游戏

### 3. ShortcutCreationPage
**路径**: `HMCL/src/main/java/org/jackhuang/hmcl/ui/automation/ShortcutCreationPage.java`

快捷方式创建对话框。

**功能**:
- 选择游戏版本
- 输入服务器地址
- 选择快捷方式类型
- 勾选是否同时创建启动脚本
- 一键创建桌面/开始菜单快捷方式

## 国际化支持

新增的自动化功能支持多语言，包括：
- 中文 (zh_CN)
- 英文 (en)

资源文件路径:
- `HMCL/src/main/resources/assets/lang/I18N_automation.properties` (中文)
- `HMCL/src/main/resources/assets/lang/I18N_automation_en.properties` (英文)

**关键翻译项**:
```properties
automation.server_bookmarks=服务器书签
automation.quick_launch=快速启动
automation.create_shortcut=创建快捷方式
automation.desktop_shortcut=桌面快捷方式
automation.start_menu_shortcut=开始菜单快捷方式
```

## 集成到现有系统

### 1. 初始化管理器

在应用启动时初始化各个管理器:

```java
public class YourApp {
    public void init() {
        Path dataDir = Path.of(System.getProperty("user.home"), ".hmcl");
        
        // 初始化各个管理器
        ServerBookmarkManager.getInstance(dataDir);
        QuickLaunchManager.getInstance(dataDir);
    }
}
```

### 2. 在版本设置页面添加入口

可以在现有的版本设置页面中添加快捷方式创建按钮:

```java
// 在 VersionSettingsPage 中添加
JFXButton createShortcutButton = new JFXButton(i18n("automation.create_shortcut"));
createShortcutButton.setOnAction(e -> ShortcutCreationPage.showCreateShortcutDialog());
```

### 3. 在主页面添加工具入口

可以在主页面添加自动化工具页面入口:

```java
// 在 MainPage 中添加
Tab automationTab = new Tab(i18n("automation"));
automationTab.setContent(new ServerBookmarksPage());
```

## 数据持久化

所有数据以 JSON 格式存储在用户数据目录中：

```
~/.hmcl/
├── server_bookmarks.json  # 服务器书签
├── quick_launch.json      # 快速启动配置
└── ...
```

### 数据格式示例

**server_bookmarks.json**:
```json
[
  {
    "name": "生存服务器",
    "address": "survival.example.com:25565",
    "associatedVersion": "1.20.1",
    "description": null,
    "createdAt": 1234567890000,
    "lastUsedAt": 1234567890000,
    "useCount": 5
  }
]
```

**quick_launch.json**:
```json
[
  {
    "id": "ql_1234567890_1234",
    "name": "快速游戏",
    "versionId": "1.20.1",
    "serverAddress": "play.example.com:25565",
    "accountName": null,
    "maxMemory": 4096,
    "fullscreen": false,
    "javaPath": null,
    "createdAt": 1234567890000,
    "lastUsedAt": 1234567890000,
    "useCount": 10,
    "description": "常用服务器"
  }
]
```

## 扩展功能建议

### 1. 服务器状态检查
可以添加服务器在线状态检测功能:
```java
public class ServerStatusChecker {
    public boolean isServerOnline(String address) {
        // 实现 ping 服务器功能
    }
    
    public int getPlayerCount(String address) {
        // 获取在线玩家数量
    }
}
```

### 2. 自动启动调度
可以添加定时自动启动功能:
```java
public class AutoLaunchScheduler {
    public void scheduleLaunch(QuickLaunchConfig config, CronExpression cron) {
        // 使用 cron 表达式调度自动启动
    }
}
```

### 3. 启动脚本模板
可以添加自定义启动脚本模板:
```java
public class LaunchScriptTemplate {
    public String generateScript(ShortcutInfo info, String template) {
        // 使用模板生成启动脚本
    }
}
```

### 4. 云同步
可以添加书签和配置的云同步功能:
```java
public class BookmarkSyncService {
    public void syncBookmarks() {
        // 同步书签到云端
    }
    
    public void syncQuickLaunchConfigs() {
        // 同步快速启动配置
    }
}
```

## 最佳实践

1. **数据备份**: 定期备份 JSON 数据文件
2. **错误处理**: 妥善处理文件读写异常
3. **性能优化**: 大量书签时考虑使用数据库
4. **安全性**: 验证服务器地址格式，防止注入
5. **用户体验**: 提供清晰的错误提示

## 常见问题

**Q: 快捷方式创建失败？**
A: 检查是否有文件写入权限，确保目标目录存在。

**Q: 服务器地址格式不正确？**
A: 使用 `ServerAddress.parse()` 验证地址格式。

**Q: 数据丢失怎么办？**
A: 查找备份文件或 JSON 文件中的错误数据。

**Q: 如何导出书签？**
A: 直接复制 `server_bookmarks.json` 文件即可。

## 技术栈

- **Java**: 17+
- **JavaFX**: UI 组件
- **Gson**: JSON 序列化
- **HMCL Core**: 游戏启动和版本管理

## 相关文件列表

### 核心类 (HMCLCore)
- `HMCLCore/src/main/java/org/jackhuang/hmcl/util/ServerBookmark.java`
- `HMCLCore/src/main/java/org/jackhuang/hmcl/util/ServerBookmarkManager.java`
- `HMCLCore/src/main/java/org/jackhuang/hmcl/util/ShortcutManager.java`
- `HMCLCore/src/main/java/org/jackhuang/hmcl/util/QuickLaunchConfig.java`
- `HMCLCore/src/main/java/org/jackhuang/hmcl/util/QuickLaunchManager.java`

### UI 类 (HMCL)
- `HMCL/src/main/java/org/jackhuang/hmcl/ui/automation/ServerBookmarksPage.java`
- `HMCL/src/main/java/org/jackhuang/hmcl/ui/automation/QuickLaunchPage.java`
- `HMCL/src/main/java/org/jackhuang/hmcl/ui/automation/ShortcutCreationPage.java`

### 资源文件
- `HMCL/src/main/resources/assets/lang/I18N_automation.properties`
- `HMCL/src/main/resources/assets/lang/I18N_automation_en.properties`

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/automation`)
3. 提交更改 (`git commit -am 'Add automation features'`)
4. 推送到分支 (`git push origin feature/automation`)
5. 创建 Pull Request

## 许可证

本项目遵循 GPLv3 许可证。详情请参阅 LICENSE 文件。

## 联系方式

- GitHub Issues: https://github.com/HMCL-dev/HMCL/issues
- Discord: https://discord.gg/jVvC7HfM6U

## 更新日志

### v1.0 (2026-05-25)
- 实现服务器书签管理功能
- 实现快捷方式管理功能
- 实现快速启动配置功能
- 添加中文和英文国际化支持
- 创建 UI 管理页面
