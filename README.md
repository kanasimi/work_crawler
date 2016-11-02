# qq_comic
批量下載腾讯漫画的工具。
Download qq comics.

## 工作流程
本工具將把所指定的漫畫下載至特定目錄中（預設為工具檔名 <code>qq_comic</code>）。
接續下載時，將從上次的進度（最後下載的章節）接著下載。
若是下載出錯，重新執行即可接續下載。

## 公開目的
* 示範如何使用 [CeJS](https://github.com/kanasimi/CeJS) 批量下載腾讯漫画。
* 展示程式撰寫當時，腾讯漫画之網站資料結構。
非常歡迎提供使用意見與改善建議。

## Node.js usage

### Installation
First, go to [nodejs.org](https://nodejs.org/), download the runtime environment and install the node.js package.
請先安裝 node.js。

Then, install the CeJS library:
接著安裝 CeJS library:
``` sh
$ npm install cejs
```

### Running
``` sh
$ node qq_comic.js "漫画作品名称"
```

## 聲明
本工具僅供同好學習和研究，嚴禁傳播或用於任何商業、非法用途！利用本工具可能引起的任何糾紛或損失損害，本人概不負責。
