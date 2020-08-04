# CeJS オンライン小説/コミックダウンローダー
- [ja] ウェブ小説 (→ epub)、ウェブ漫画作品を一括ダウンロードツール。

## 言語サポート
[一緒に翻訳しましょう](https://github.com/kanasimi/work_crawler/issues/185)！

| Language | サポート |
|---|:---:|
| 繁體中文 | ✔️ |
| 简体中文 | ✔️ |
| English | ✔️ |
| Português brasileiro | 🚧 |
| 日本語 | 🚧 |
| 한국어 | 🚧 |

## OSサポート
| OS | サポート |
|---|:---:|
| Windows | ✔️ |
| macOS | ✔️ |
| UNIX, Linux | ✔️ |
<!-- | Android | ❌ | -->

## インターフェースのサポート
| インターフェース | サポート |
|---|:---:|
| [GUI](https://en.wikipedia.org/wiki/Graphical_user_interface) グラフィカル | ✔️ |
| [CLI](https://en.wikipedia.org/wiki/Command-line_interface) コマンドライン | ✔️ |
| API | ✔️ |

## Features
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## 対応サイト
* For novels, please install [7-Zip](https://en.wikipedia.org/wiki/7-Zip) command-line version first.
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

### ライトノベル 日本語のオンライン小説
[novel.ja-JP/](novel.ja-JP/)*.js, web pages → epub

| Site 平臺名稱 | Tool file | Note 說明 |
| --- | --- | --- |
| [アルファポリスの小説](https://www.alphapolis.co.jp/novel) | AlphaPolis.js | 使用頻度制限あり。レンタルする話は取得できません |
| [カクヨム](https://kakuyomu.jp/) | kakuyomu.js | |
| [ハーメルン](https://syosetu.org/) | Hameln.js | |
| [小説を読もう！](https://yomou.syosetu.com/) | yomou.js | [小説家になろう](http://syosetu.com/) |
| [ノクターンノベルズ](https://noc.syosetu.com/) | noc.js | [小説家になろう](http://syosetu.com/)の[男性読者向けの18禁部門サイト](http://noc.syosetu.com/site/faq/) |
| [ミッドナイトノベルズ](https://mid.syosetu.com/) | mid.js | [小説家になろう](http://syosetu.com/)の[男性読者向けの『官能を主目的としない』R18作品を探すことができるサイト](http://noc.syosetu.com/site/faq/) |
| [ムーンライトノベルズ](https://mnlt.syosetu.com/top/top/) | mnlt.js | [小説家になろう](http://syosetu.com/)の[女性読者向けのR18作品を探すことができるサイト](http://noc.syosetu.com/site/faq/) |

### 日本語のウェブコミック
[comic.ja-JP/](comic.ja-JP/)*.js, images → zip

| Site | Tool file | Note |
| --- | --- | --- |
| [ニコニコ静画](https://seiga.nicovideo.jp/) | nico_seiga.js | アカウントが必要です。 ドワンゴ DWANGO Co., Ltd. |
| [ComicWalker](https://comic-walker.com/) | ComicWalker.js | KADOKAWAの無料漫画（マンガ） コミックウォーカー 後端採用ニコニコ静画技術 |
| [ヤングエースUP](https://web-ace.jp/youngaceup/) | youngaceup.js | KADOKAWA webエース 所属 |
| [TYPE-MOONコミックエース](https://web-ace.jp/tmca/) | tmca.js | KADOKAWA webエース 所属 |
| [アルファポリスの公式Web漫画](https://www.alphapolis.co.jp/manga/official) | AlphaPolis_official_manga.js | レンタルする話は取得できません |
| [アルファポリスの無料の漫画投稿](https://www.alphapolis.co.jp/manga/user) | AlphaPolis_user_manga.js | |
| [モアイ](http://www.moae.jp/) | moae.js | 講談社 モーニング・アフタヌーン・イブニング合同Webコミックサイト |
| [pixivコミック](https://comic.pixiv.net/) | pixivcomic.js | pixivコミック(ぴくしぶこみっく) |
| [サイコミ](https://cycomi.com/fw/cycomibrowser/title/serialization/0) | cycomi.js | |
| [コミコ](https://www.comico.jp/)<br />[オトナ限定 コミコ](http://plus.comico.jp/) | comico_jp.js<br />comico_jp_plus.js | 本工具經設定帳號資訊後，可自動使用閱讀卷(レンタル券)，但無法處理互動式漫畫、coin收費作業。 |
| ~~[MAGCOMI](https://comic.mag-garden.co.jp/)~~ | ~~archive/MAGCOMI.js~~ | マグコミ: [ActiBook](https://ebook.digitalink.ne.jp/)系統。2020/3 圖片經過特殊處理 |
| ~~[XOY](https://xoy.webtoons.com/)~~ | ~~archive/XOY.js~~ | NAVER WEBTOON ja<br />2018.09.13: [XOYの作品が「LINEマンガ」に移行されます。](https://xoy.webtoons.com/ja/notice/detail?noticeNo=849) |
| ~~[OVERLAP](https://over-lap.co.jp/gardo/)~~ | ~~archive/OVERLAP.js~~ | オーバーラップ コミックガルド: [ActiBook](https://ebook.digitalink.ne.jp/)系統。2019/7/5 改版，域名移至[コミックガルド](https://comic-gardo.com/)，之後轉成與[となりのヤングジャンプ](https://tonarinoyj.jp/)相同系統，圖片經過 canvas 處理以展示。不再支援。 |

## インストール
1. [7-Zip](https://www.7-zip.org/) 18.01+ をインストールします。
2. [![GitHub release](https://img.shields.io/github/release/kanasimi/work_crawler.svg)リリース パッケージ](https://github.com/kanasimi/work_crawler/releases/latest/) をインストールします。

### 迅速なインストール
1. [node.js](https://nodejs.org/) と [7-Zip](https://www.7-zip.org/) 18.01+ をインストールします。
2. インストール脚本 <code>[work_crawler.updater.js](https://raw.githubusercontent.com/kanasimi/work_crawler/master/work_crawler.updater.js)</code> をダウンロードします。
3. [node.js](https://nodejs.org/) で、<code>[work_crawler.updater.js](https://raw.githubusercontent.com/kanasimi/work_crawler/master/work_crawler.updater.js)</code> を実行します。
4. これで[実行](#実行)できます。

* 🚧 Not yet full translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

### Legacy installation
* 🚧 Not yet full translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

#### Setup GUI
* 🚧 Not yet full translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## 実行
GUIを使用したい場合は、`start_gui_electron.bat` 或は `start_gui_electron.sh` を実行してください。

* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Workflow
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Uninstallation
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## FAQ
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Notes
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Purpose
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Announce
* 🚧 Not yet translated, please refer to [Chinese document](README.cmn-Hant-TW.md).

## Contact
Contact us at [GitHub](https://github.com/kanasimi/work_crawler/issues).

[![logo](https://raw.githubusercontent.com/kanasimi/CeJS/master/_test%20suite/misc/logo.jpg)](http://lyrics.meicho.com.tw/)
