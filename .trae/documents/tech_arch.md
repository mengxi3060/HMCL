## 1. Architecture Design
```mermaid
flowchart TB
    subgraph Frontend [React Frontend]
        A[输入组件] --> B[链接提取逻辑]
        B --> C[API调用]
        C --> D[结果展示组件]
        D --> E[下载组件]
    end
    
    subgraph Backend [Express Backend]
        F[解析API路由] --> G[链接解析服务]
        G --> H[抖音API调用]
    end
    
    subgraph External [外部服务]
        I[抖音服务器]
    end
    
    A --> F
    H --> I
```

## 2. Technology Description
- **Frontend**: React@18 + TypeScript + TailwindCSS@3 + Vite
- **Initialization Tool**: vite-init
- **Backend**: Express@4 + TypeScript
- **Database**: 无需数据库（无持久化需求）

## 3. Route Definitions
| Route | Purpose |
|-------|---------|
| / | 主页，包含输入框和解析功能 |

## 4. API Definitions

### 4.1 解析抖音链接
- **Endpoint**: `POST /api/parse`
- **Request**:
```typescript
interface ParseRequest {
  text: string; // 用户输入的文本
}
```
- **Response**:
```typescript
interface ParseResponse {
  success: boolean;
  message?: string;
  data?: {
    videoUrl: string;      // 视频下载链接
    coverUrl: string;      // 封面图片链接
    caption: string;       // 视频文案
    title?: string;        // 视频标题
    author?: string;       // 作者信息
  };
}
```

### 4.2 健康检查
- **Endpoint**: `GET /api/health`
- **Response**:
```typescript
interface HealthResponse {
  status: 'ok';
  timestamp: number;
}
```

## 5. Server Architecture Diagram
```mermaid
flowchart LR
    A[客户端请求] --> B[Express路由]
    B --> C[解析控制器]
    C --> D[链接提取服务]
    D --> E[抖音API调用]
    E --> F[返回结果]
```

## 6. Data Model
无需数据库，所有数据均为临时处理