# 邻里小站 · 青禾里

面向 iPhone 竖屏的单小区生活服务演示。商品、小区、订单和售后均为演示数据。订单、购物袋和售后申请保存在当前浏览器。

| 页面 | 演示操作 |
| --- | --- |
| 生鲜直采 | 按类别选购、加购、自提信息 |
| 邻里严选 | 浏览本地精选、加购 |
| 管家售后 | 登记商品或自提问题、查询申请记录 |
| 我的小区 | 查看自提点、模拟订单和主屏幕安装说明 |

从本目录运行 `python3 -m http.server 3000`，打开 [本地预览](http://localhost:3000/)。页面无需安装依赖或编译。

GitHub 仓库的 Settings → Pages → Source 选择 GitHub Actions。`main` 分支更新会自动发布，Actions 的部署任务会显示预览地址。用 iPhone Safari 打开 HTTPS 地址，点按「分享」→「添加到主屏幕」，如有「作为网页 App 打开」选项，保持开启。

图片来源为 Unsplash。Tailwind CSS 和 Lucide 通过 jsDelivr 加载。Service Worker 缓存应用自身静态资源。
