# NewBeePlayer

🤟 一个性冷淡的web端音乐可视化播放器

## Demo

💖 [NewBeePlayer -- hosted by Vercel](https://new-bee-player.vercel.app/)

## 简介

「NewBeePlayer」 是一个 Web 端音乐可视化播放器，用户界面以黑白为主，整体风格简洁干净，同时支持用户个性化的设置自己喜欢的风格。

音乐可视化在本项目中主要表现为播放、展示，在使用过程中用户以观看和聆听为主，有较少的操作参与，同时可视化信息易懂、清晰，降低了用户的认知负荷，让用户在整体使用过程中，可以保持较低的思维水平和操作水平，使用户得到身心放松，心情愉悦的体验。

团队基于 Regl、three.js 和 TypeScript，实现对音频频谱的三维可视化效果，同时引入基于 Three.js 的proton 粒子包，实现对不同音乐track的可视化动态粒子交互。 
通过 webtorrent 去中心化分享资源与拉取资源，axios 库与后端通信，节约带宽资源。通过基于 Node.js 和TypeScript 的 Vercel Serverless Functions，实现后端与管理中台，实现对音乐的增删改查以及音频的信息编辑。

## 项目特点

✅ 采用 TypeScript，静动态数据结合。

✅ 基于 three.js 包的开发：参考[文档]([Three.js – JavaScript 3D Library](https://threejs.org/))进行项目初始化，画布的添加以及3D效果的引用，用3D效果进行音乐的动态展示，将无形的波纹有形化，增加听众的视觉效果，为听众提供更加完美的音乐欣赏盛宴。

✅ 引入基于 three.js 的[proton 粒子包](https://drawcall.github.io/Proton/)，实现不同音乐 track 的可视化动态粒子交互，提高用户体验感。

## 未来计划

💭 通过[webtorrent](https://github.com/webtorrent/webtorrent)提供去中心化的音频服务，通过P2P的方式降低带宽成本。

💭 采用[APlayer](https://github.com/MoePlayer/APlayer) 完善播放器的完整功能，优化用户体验。

## License

[Apache-2.0](https://github.com/FrontendNewbies/NewBeePlayer/blob/main/LICENSE)，部分代码学习参考自[audiofabric](https://github.com/rolyatmax/audiofabric)。
