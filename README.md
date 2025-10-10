#### 莉莉菈将对你的【罪行】进行审判
开始
```
$ npm i -g @nestjs/cli
$ nest new ririra-said
```
结构
```
ririra-said/
├─ src/
│  ├─ main.ts
│  ├─ app.module.ts
│  ├─ webhook.controller.ts
│  ├─ event-bus.service.ts
│  ├─ plugin.interface.ts
│  ├─ plugin-manager.service.ts
│  ├─ plugin.controller.ts   # 插件市场 API
│─ plugins/
│  └─ hello.plugin.js    # 插件示例（支持动态加载）
```
插件实例【[ririra-plugins-name](https://github.com/LoveLoliii/ririra-plugins-name#)】

安装测试
```
curl -X POST http://localhost:3000/plugin/install \
  -H "Content-Type: application/json" \
  -d '{"name":"ririra-plugins-name","url": "https://github.com/LoveLoliii/ririra-plugins-name.git"}'

```

相关文档：
- [nestjs](https://docs.nestjs.cn/introduction)
