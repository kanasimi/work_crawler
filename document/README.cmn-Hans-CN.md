# CeJS 网路小说漫画下载工具
- [CN] 批量下载小说 (→ epub)、漫画网站作品的网络爬虫。

## 快速浏览
* [安装](#安装)
   * [懒人安装法](#懒人安装法)
* [执行](#execution-执行)

## 多语言支援
Welcome to join [the translating project](https://github.com/kanasimi/work_crawler/issues/185)!

| 语言 | 支援状况 |
|---|:---:|
| 繁體中文 | ✔️ |
| 简体中文 | ✔️ |
| English | ✔️ |
| Português brasileiro | 🚧 |
| 日本語 | 🚧 |
| 한국어 | 🚧 |

## 作业系统支援
| 作业系统平台 | 支援状况 |
|---|:---:|
| Windows | ✔️ |
| macOS | ✔️ |
| UNIX, Linux | ✔️ |
<!-- | Android | ❌ | -->

## 支援界面
| 界面 | 支援状况 |
|---|:---:|
| [GUI](https://en.wikipedia.org/wiki/Graphical_user_interface) 图形 | ✔️ |
| [CLI](https://en.wikipedia.org/wiki/Command-line_interface) 命令行 | ✔️ |
| API 应用程式界面 | ✔️ |

## Features 特点
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Supported sites 已完成之网站工具
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## 安装

若是想要使用系统安装的方法，或者您的系统并未提供命令行界面，您可以 **[直接下载📦安装包![GitHub release](https://img.shields.io/github/release/kanasimi/work_crawler.svg)](https://github.com/kanasimi/work_crawler/releases/latest/)**，并且安装 [7-Zip](https://www.7-zip.org/) 18.01 以上的版本。惟 **安装包不含最新的功能**，有些网站下载起来会出问题。安装包现在落后最新测试版修正次数：![Github commits (since latest release)](https://img.shields.io/github/commits-since/kanasimi/work_crawler/latest.svg)。欲采用最新版本，或研究开发、想要使用命令行界面作批次处理，请采用下列步骤。

### 懒人安装法
为了想赶快尝鲜的您～<!-- （已经做过的步骤可以跳过） -->
1. 先安装 [node.js](https://nodejs.org/) 与 [7-Zip](https://www.7-zip.org/) 18.01 以上的版本。<!-- 下载小说须先安装 [7-Zip](https://en.wikipedia.org/wiki/7-Zip) 以制作 .epub 电子书。 --> **请将程式安装于预设路径下，否则可能出现错误！** 已经安装过的可以跳过。Node.js 用以执行本工具。7-Zip 在更新本工具，或者打包漫画章节，以及制作电子书时使用。
2. 下载并储存本工具安装档 <code>[work_crawler.updater.js](https://raw.githubusercontent.com/kanasimi/work_crawler/master/work_crawler.updater.js)</code>（按右键另存新档）。本工具安装档 **预设会将所有组件放在 `work_crawler-master` 目录下**。
3. 若在中国大陆使用本工具，您可能需要更改预设 npm registry 至[淘宝 npm 镜像](https://developer.aliyun.com/mirror/NPM)，以加快下载速度：<details><summary>（点击本文字可获得更详细的说明）</summary>
   ```bash
   npm config set registry https://registry.npm.taobao.org
   ```
   附注：恢复预设设定请执行
   ```bash
   npm config set registry https://registry.npmjs.org
   ```
</details>

4. <details><summary>在命令行界面下以 Node.js 执行安装档 `work_crawler.updater.js`。（本安装档不能直接点击两下执行。点击本行可获得更详细的说明。）</summary>

   1. **进入[命令行界面](https://zh.wikipedia.org/wiki/%E5%91%BD%E4%BB%A4%E8%A1%8C%E7%95%8C%E9%9D%A2)下**：
      * Windows 10 下，请按下<kbd>[⊞ Windows键](https://zh.wikipedia.org/wiki/Windows%E9%94%AE)</kbd> + <kbd>X</kbd> → 选择 **命令提示字元**。（如下图的示范）
      * Windows 7 下[打开命令行界面](https://carolhsu.gitbooks.io/django-girls-tutorial-traditional-chiness/content/intro_to_command_line/README.html)，请从  开始 → 所有程式 → 附属应用程式 → 选择 **命令提示字元**

      ![Windows 10 下，进入命令行界面](https://lh3.googleusercontent.com/yFKRG6LTfvbJhMljgIXrEUFivGl4LRYgs0FlNBCBZ1KmwUW2paSoubLhyWGhS7S9GsHe1ef7Bt3TRyf5IHWRLdFL_SqywkPikecwlSpYtPHM6KRlyEaFWsWZqrS7DF3JzzcycnfxfQ=w2400)

   2. **进到本工具安装档 `work_crawler.updater.js` 所在的目录**：
      * 若是您视窗的 **背景为蓝色**，表示您使用的可能是 [PowerShell](https://zh.wikipedia.org/wiki/Windows_PowerShell)，您应该使用这种形式的指令来切换目录：<code style="color:#888;background-color:#008b8b;">cd "本工具安装档所在的目录"</code>。
      * 若是您视窗的 **背景为黑色**，表示您使用的可能是 [Command Prompt 命令提示字元](https://zh.wikipedia.org/wiki/%E5%91%BD%E4%BB%A4%E6%8F%90%E7%A4%BA%E5%AD%97%E5%85%83)，您应该使用这种形式的指令来切换目录：`cd/d "本工具安装档所在的目录"`（**cd/d** 表示「同时变更工作磁碟机及其工作目录」的意思）。

   3. **执行命令以下载最新版本组件**（本安装档必须以 `node` 执行， **不能直接点击两下执行**。）：
      ```bash
      node work_crawler.updater.js
      ```

   4. 执行完毕后，除了 `work_crawler-master` 这个目录，还会出现一些附属档案。这些档案是帮助更新用的，就算删除也不会影响程式运行或更新。
</details>

5. 然后就能[开始试用](#execution-执行)啰。
   <details><summary>下载 CeJS 程式库后本工具安装的目录看起来的样子：</summary>

   ![下载 CeJS 程式库后本工具安装的目录看起来的样子](https://lh3.googleusercontent.com/rVTuL3GHoWjXcJBW3O0KutvRTlf-HjQa5dzm_PJwizhMDN38JG8RIdJ7nuZyWA6m2G9d2McEP_XdyNmGwn0kVdSjwDzJaS6w9D9SOtETBCnO9fAue82-J3qMtEm8yxgkjOLr5EBnjg=w150-h330-no)

   以下是在linux下直接操作上述作业时的指令，Windows用户可以跳过，直接[开始试用](#execution-执行)。
   ```bash
   # sample commands to extract work_crawler + cejs
   curl -O https://raw.githubusercontent.com/kanasimi/work_crawler/master/work_crawler.updater.js
   # wget https://raw.githubusercontent.com/kanasimi/work_crawler/master/work_crawler.updater.js
   node work_crawler.updater.js
   ```
</details>

6. 若是您将 CeJS 放置在其他目录底下，您可以从 <code>[_repository_path_list.txt](https://github.com/kanasimi/CeJS/blob/master/_for%20include/_repository_path_list.sample.txt)</code> 这个档案来设定放置的路径。
7. 您可设定 `work_crawler.configuration.js` 以指定 **所有网站采用之预设主要下载目录**，所下载的作品档案预设会放置到此主要目录之工具档名称底下。简便的方法是：
   1. 将 `work_crawler.default_configuration.js` 改名成 `work_crawler.configuration.js`。只要在 `work_crawler.configuration.js` 档案里面，已将所有选项设定好；那么是否有 `work_crawler.default_configuration.js` 并不影响程式运作，请不用担心。
   2. 直接用文字编辑器打开 `work_crawler.configuration.js`，找到 `global.data_directory = '';` 这一段，把引号中改成您要的 **所有网站采用之预设主要下载目录**；例如：
      ```javascript
      global.data_directory = 'D:\\web_works\\';
      ```
      **请记得在引号中，目录分隔号必须输入两次！** 这不会影响到您之前曾手动改变过的标的目录。

8. 每次要更新到最新版本时，只要进到工具安装档所在目录，重新执行一次本工具安装档即可。
   ```bash
   node work_crawler.updater.js
   ```
   由于本工具会 cache 作品资讯，更新幅度较大的时候，新程式可能无法读取这些旧格式的 cache，会产生错误；此时您需要删除下载目录中所有的 cache，重新下载作品。这些 cache 包括 search.json, servers.json 以及作品目录下面，以作品名称为名的 .json 档案。

<!-- use npm:
3. 在命令行界面下，进到解压缩后工具档所在的目录，执行命令以下载 CeJS 程式库：（`npm install` 可能将 cejs 安装在此目录下之 node_modules/cejs 目录内 ）
   ```bash
   npm install cejs
   ```
4. 然后就能[开始试用](#execution-执行)啰。
* 请注意：采用 `npm install cejs` 安装的可能不是最新版的 CeJS，尚未加入最新功能。当采用新版下载工具与旧版 CeJS 程式库时，执行起来会出错，请见谅。**建议采用下方一般正常安装方法**，下载最新版本 [CeJS](https://github.com/kanasimi/CeJS) 压缩档，解开后配置；而不是直接执行 `npm install` 安装旧版的程式库。
-->

### Legacy installation 一般正常安装方法
1. Please see [Node.js usage section at CeJS](https://github.com/kanasimi/CeJS#nodejs-usage--nodejs-运行方式) for detail.
2. Setup [_repository_path_list.txt](https://github.com/kanasimi/CeJS/blob/master/_for%20include/_repository_path_list.sample.txt) if necessary.
3. 最后设定好设定档 `work_crawler.configuration.js` (see [work_crawler.default_configuration.js](https://github.com/kanasimi/work_crawler/blob/master/work_crawler.default_configuration.js))。例如指定 `global.data_directory`。

#### Setup GUI 设定视窗型态界面
若是您在作研究开发时，希望使用[图形使用者界面](https://zh.wikipedia.org/wiki/%E5%9B%BE%E5%BD%A2%E7%94%A8%E6%88%B7%E7%95%8C%E9%9D%A2)，那么您还需要安装 [Electron](https://electronjs.org/)。若是您采用懒人安装法，应该已经安装过 Electron，可以直接采用图形使用者界面。
1. 请在[命令行界面](https://zh.wikipedia.org/wiki/%E5%91%BD%E4%BB%A4%E8%A1%8C%E7%95%8C%E9%9D%A2)下，进到本工具安装的目录，执行命令以安装 Electron 程式库：
   ```bash
   npm i -D electron@latest
   ```
2. 在本工具安装的目录下，执行 `start_gui_electron.bat` 或 `start_gui_electron.sh`。

   ![视窗型态界面](https://lh3.googleusercontent.com/L0wxAGlxz0G9fvQQNamoXugC3WeJdnYaxqaxPnNE_3gnUtH0VBlGNScH_Y44MpkbiYYmLgajHMFt6desqDYYJbYT0RuMvAyrGlDGx9uWuYH-dEm6T6B9SG9dgUSG6uQAFrPATo1llw=w2400)

   视窗型态界面支援不同语系：
   ![支援不同语系](https://lh3.googleusercontent.com/-EOQgYAap6YPw7iKQRlvlA4-fr37-4SddypCw44H2uhgpgmQ6FtpjjJ-qg_gJHbwfNRn8GNvvoYqE46yIQwg3xOVzR-5mzfqX8tPhOM06iYdF2gXOuIddcN5rNlCMhmmIxYye7SX8g=w2400)

   有许多可调整的下载选项：
   ![有许多可调整的下载选项](https://lh3.googleusercontent.com/uEUr-iYs1JKoZukar44sOqxSL908uPTSjSG4eDco-O8bFjjIFkxSRsPy2UMkcnI3Z7Hfn-zZ2wdE9OjRr1CQZs_DfoGjvJLBCoRg9g4GH-JxG9ZpwT8fX8srn958jBzJzNbWcMvdIg=w2400)

   可选用暗色系主题：
   ![暗色系主题](https://lh3.googleusercontent.com/qS2i8iJTQ21bY8_IbHkBDG0__svP_zJIaYXKREbXW3lNmYA4XyJVLfJ0eyvJ6mb_k0jmGXNLRmKsngfdob-lkrLrHq9HLkcP3vVgXxx4ZQLbA85o7bRAurPiN_-Py3t7AZoop5S78g=w2400)

   能一键搜寻各网站与下载作品：
   **搜寻名称用于跨网站。仅能搜寻作品名称，无法搜寻作品id。假如您已知作品id，可以直接在最爱作品清单输入id，用不着搜寻。**
   ![一键搜寻各网站与下载作品](https://lh3.googleusercontent.com/pz0zKuF5-kxFle8EgoUMfNAF7V8Kq6M_Dw9HVBvbXrF3hIW94voHHstMSsoZXmmmuVCxCk-Tfev6g0OJ2Ee7aZViYGiCB9hi5lJRlJ0r0eY9KjYkgW-BV2OOq8fPwp0Hi8RylR-YQQ=w2400)

## Execution 执行
若是您希望使用[图形使用者界面](https://zh.wikipedia.org/wiki/%E5%9B%BE%E5%BD%A2%E7%94%A8%E6%88%B7%E7%95%8C%E9%9D%A2)，请执行 `work_crawler-master` 目录下面的 `start_gui_electron.bat` 或 `start_gui_electron.sh`。

所有操作都必须进到工具档所在的目录，在命令行界面下执行。
1. 确认要下载的网站名与作品名。之后在命令行界面下，执行：（请在作品的名称外面加上引号）

   ```bash
   node 工具档名.js "作品名" [option=true] [option=value]
   node 工具档名.js "l=作品列表档案名" [option=true] [option=value]
   ```

   e.g.,
   ```bash
   cd comic.cmn-Hans-CN && node qq.js "狐妖小红娘" skip_error=true
   cd novel.cmn-Hans-CN && node qidian free && echo "下载 起点中文网限免作品"
   cd novel.cmn-Hans-CN && node 23us "斗罗大陆Ⅲ龙王传说" proxy=localhost:8080
   cd comic.cmn-Hans-CN && node 2manhua "大主宰" recheck=true
   cd comic.cmn-Hans-CN && node ikanman "l=ikanman.txt" recheck=true
   cd novel.cmn-Hans-CN && node 630book "267" && echo "via id"
   cd novel.ja-JP       && node yomou "転生したらスライムだった件"
   ```

   ![命令行界面下执行命令](https://lh3.googleusercontent.com/r1-jB1Cmaznb5kseN97xUQyGzrsJJgek25Ifyvey8scMm311WjnjIAy-FpmiTtIVupyimDTWrVL7aI2cI7i2FRllR_QWMiLsRgF-kzDJnYMRaTRMVXrG2XkfEhHPh5Qvns0XQjROcw=w2400)

2. 下载的档案将放在设定档 `work_crawler.configuration.js` 的 `global.data_directory` 所设定的目录下。若采[懒人安装法](#懒人安装法)，则预设放在解压缩后工具档所在的目录下。
3. 本工具会循序下载每个章节，对于漫画基本上每个章节的图片会并行下载。不可并行下载同一个网站的同一个作品，否则会出现冲突。若是想要并行下载不同网站或是不同的作品，那么您就需要再开一个命令行界面来执行工具档。
4. 若是下载出错，**重新执行即可接续下载**。

## Workflow 工作流程
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Uninstallation 移除
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## FAQ 常见问题集
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Notes 附注
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Purpose 公开目的
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Announce 声明
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Contact 联络我们
Contact us at [GitHub](https://github.com/kanasimi/work_crawler/issues).

[![logo](https://raw.githubusercontent.com/kanasimi/CeJS/master/_test%20suite/misc/logo.jpg)](http://lyrics.meicho.com.tw/)
