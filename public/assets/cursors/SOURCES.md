# 光标素材的来源与取舍

## 出处

本目录下的 `.cur` 文件全部复制自另外一个 Halo 主题项目：

```
halo-theme-dream2.0-plus/templates/assets/cursor/
（该项目 LICENSE 为 MIT，Copyright (c) 2021 Nineya / 2025 mjsoftking, hcjike, hc, 宏尘, 宏尘极客）
```

**该项目的 MIT 声明里没有包含这批素材的任何署名或来源说明** —— 也就是说它们是
以「来源不明的第三方素材」的形态被收在那个仓库里的。本主题按站长的决定沿用这批素材，
在此如实记录出处，便于日后需要替换或补充授权说明时能找到来路。

> 若要把本主题用于商业项目，建议先自行确认这批光标素材的授权；仅替换本目录下的文件
> 即可换成自有素材，代码侧不需要改动（改 `src/utils/cursor-styles.ts` 的文件名映射）。

## 为什么只有 37 个文件

上游那套素材共 **87 个文件、约 2.1MB**，但它的 `common/config.html` 只引用了其中 19 个
（外加走 `<style>/arrow.cur` + `hand.cur` 通用约定的 18 个），合计 **37 个文件、约 205KB**。

剩下的 50 个文件在原主题里没有任何一项设置会用到，且体积可观：

| 文件                                 | 体积      |
| ------------------------------------ | --------- |
| `overwatch/busy.ani`                 | 713 KB    |
| `overwatch/work.ani`                 | 199 KB    |
| `marry/working.ani`                  | 85 KB     |
| `marry/busy.ani`                     | 57 KB     |
| `marry/beam.ani`、`marry/*.ani` 其余 | 约 170 KB |

**未收录的一律是 `.ani` 动画光标与多余的状态光标**（忙碌 / 拖拽 / 调整大小等），
本主题只需「默认 / 手型 / 文本 / 缩放」四态。要全量补进来，直接从上游目录复制过来即可，
`cursor-styles.ts` 里的映射不用改。

## 四态与文件的对应

少数几套的四态用的是不同文件名（与上游逐条一致）：

| 样式           | 默认        | 手型      | 文本      | 缩放          |
| -------------- | ----------- | --------- | --------- | ------------- |
| `breeze`       | Arrow.cur   | Hand.cur  | IBeam.cur | Cross.cur     |
| `overwatch`    | pointer.cur | link.cur  | text.cur  | cross.cur     |
| `rainbow_rain` | normal.cur  | link.cur  | texto.cur | precision.cur |
| `marry`        | arrow.cur   | arrow.cur | beam.cur  | move.cur      |
| `black_cat`    | normal.cur  | ayuda.cur | texto.cur | precision.cur |
| 其余九套       | arrow.cur   | hand.cur  | arrow.cur | arrow.cur     |

九套通用的是：`OwO` / `UwU` / `mellow` / `water_01` / `water_02` / `horse` / `debris` /
`music_cat_01` / `music_cat_02`。
