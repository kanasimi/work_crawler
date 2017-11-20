# CeJS 線上小說漫畫下載工具 online novels / comics downloader
- [en] Download novels → epub and comics with command line interface.
- [TW] 批量下載小說 → epub、漫畫網站的工具。命令行界面。
- [CN] 批量下载小说 → epub、漫画网站的工具。命令行界面。
- [ja] ウェブ小説 → epub、ウェブ漫画作品を一括ダウンロードツール。コマンドラインインターフェース。

## Features 特點
* 可自動下載小說封面以及章節中的插圖。
* 可自行配置與設定。

## Supported sites 已完成之網站工具
* For novels, please install [7-Zip](https://en.wikipedia.org/wiki/7-Zip) command line version first. 請注意：小說之下載必須先安裝 7Zip，這樣才能製作 .epub 電子書。

已撰寫完的各大小說漫畫網站工具包括：

### Japanese web fictions / Japanese light novels ライトノベル 日本輕小說 日本のオンライン小説
[novel.ja-JP/](novel.ja-JP/)*.js, web pages → epub

| Site | Tool file | Note |
| --- | --- | --- |
| [アルファポリス](http://www.alphapolis.co.jp/) | AlphaPolis.js | レンタルする話は取得できません |
| [カクヨム](https://kakuyomu.jp/) | kakuyomu.js | |
| [ハーメルン](https://syosetu.org/) | Hameln.js | |
| [小説を読もう！](http://yomou.syosetu.com/) | yomou.js | [小説家になろう](http://syosetu.com/) |
| [ノクターンノベルズ](http://noc.syosetu.com/) | noc.js | [小説家になろう](http://syosetu.com/)の[男性読者向けの18禁部門サイト](http://noc.syosetu.com/site/faq/) |

### Chinese web fictions / novels 中国内地小说 中国のオンライン小説
[novel.cmn-Hans-CN/](novel.cmn-Hans-CN/)*.js, web pages → epub

| Site | Tool file | Note |
| --- | --- | --- |
| [八一中文网](http://www.81xsw.com/) | 81xsw.js | [PTCMS](https://www.ptcms.com/)系统 |
| [顶点小说](http://www.23us.cc) | 23us.js | PTCMS |
| [顶点小说](http://www.23us.com/) | ~~archive/23us.com.js~~ | PTCMS，限制了取得頁面的數量和頻率，暫時放棄。 |
| [八八读书网](http://www.88dushu.com/) | 88dushu.js | 88读书网，PTCMS? |
| [恋上你看书网](http://www.630book.la/) | 630book.js | |
| [飘天文学](http://www.piaotian.com/) | piaotian.js | NOT PTCMS |
| [卡提諾論壇 小說頻道](https://ck101.com/forum.php?gid=1180) | ck101.js | Discuz! X3 |

* 中國大陸之小說文字常常會被[審查](https://zh.wikipedia.org/wiki/%E4%B8%AD%E5%8D%8E%E4%BA%BA%E6%B0%91%E5%85%B1%E5%92%8C%E5%9B%BD%E8%A8%80%E8%AE%BA%E5%AE%A1%E6%9F%A5)而消失、變造。例如黑名單關鍵字轉為拉丁字母或是打星號，以及數字 0 改成 o、9 改成 q 等等。有時需要多下載幾個網站的文件再做比較。

### Chinese webcomics 中国内地漫画 中国のウェブコミック
[comic.cmn-Hans-CN/](comic.cmn-Hans-CN/)*.js, web pages → epub
* 本工具無法下載需VIP付費、已屏蔽或刪除的內容。

| Site | Tool file | Note |
| --- | --- | --- |
| [腾讯漫画](http://ac.qq.com/) | qq.js | **本工具無法下載VIP付費內容** 2017/8/15 起取消了今日限免 |
| [看漫画](http://www.manhuagui.com/) | manhuagui.js | **漫画柜**原[爱看漫](http://www.ikanman.com/) |
| [哦漫画](http://www.omanhua.com/) | omanhua.js | |
| [漫画台](http://www.manhuatai.com/) | manhuatai.js | |
| [爱漫画](http://www.2manhua.com/) | 2manhua.js | 許多作品似乎從2017/9/3起就沒有更新，似乎從2017/11/15左右起就持續"系统发生错误"至 2017/11/17 未復原。 |
| [古风漫画网](http://www.gufengmh.com/) | gufengmh.js | |
| [网易漫画](https://manhua.163.com/) | 163.js | 2017/7/13 **本工具無法下載VIP付費內容** |
| [快看漫画](https://www.kuaikanmanhua.com/) | kuaikanmanhua.js | |
| [733动漫网](http://www.733dm.net/) | 733dm.js | |
| ~~[热漫吧](http://www.remanba.com/)~~ | ~~archive/remanba.js~~ | 自 2016/12/27 14:42 最後一次成功連接後，下午起就持續 404 至 2017/10/19 未復原。 |
| ~~[三七阅读](http://www.37yue.com/)~~ | ~~archive/37yue.js~~ | 自 2017/6/9 下午最後一次連接後，2017/6/10 9時起就持續 404 至 2017/10/19 未復原。 |

## Installation 安裝

### Node.js lazy installation 懶人安裝法
為了想趕快嘗鮮的您～（已經做過的步驟可以跳過）
1. 先安裝 [Node.js](https://nodejs.org/) 與 [7-Zip](https://en.wikipedia.org/wiki/7-Zip)。<!-- 下載小說須先安裝 [7-Zip](https://en.wikipedia.org/wiki/7-Zip) 以製作 .epub 電子書。 -->
2. 下載[本工具壓縮檔](https://github.com/kanasimi/work_crawler/archive/master.zip)並解壓縮，應能得到 <code>work_crawler-master</code> 目錄；這將是本工具將安裝的標的目錄，若有需要亦可將之改名。
3. 下載 CeJS 安裝檔 [_CeL.updater.node.js](https://raw.githubusercontent.com/kanasimi/CeJS/master/_for%20include/_CeL.updater.node.js)，放到本工具將安裝的標的目錄下。
4. 在[命令行界面](https://zh.wikipedia.org/wiki/%E5%91%BD%E4%BB%A4%E8%A1%8C%E7%95%8C%E9%9D%A2)下，進到本工具將安裝的標的目錄，執行命令以下載 CeJS 程式庫：

   ``` cmd
   node _CeL.updater.node.js
   ```

4. 然後就能[開始試用](#execution-執行)囉。
5. 每次要更新到最新 CeJS 程式庫時，只要重新執行一次 CeJS 安裝檔即可。

<!-- use npm:
3. 在命令行界面下，進到解壓縮後工具檔所在的目錄，執行命令以下載 CeJS 程式庫：（`npm install` 可能將 cejs 安裝在此目錄下之 node_modules/cejs 目錄內 ）

   ``` cmd
   npm install cejs
   ```
4. 然後就能[開始試用](#execution-執行)囉。
-->

* 請注意：採用 <code>npm install cejs</code> 安裝的可能不是最新版的 CeJS，尚未加入最新功能。當採用新版下載工具與舊版 CeJS 程式庫時，執行起來會出錯，請見諒。**建議採用下方一般正常安裝方法**，下載最新版本 [CeJS](https://github.com/kanasimi/CeJS) 壓縮檔，解開後配置；而不是直接執行 <code>npm install</code> 安裝舊版的程式庫。

### Normal installation 一般正常安裝方法
1. Please see [Node.js usage section at CeJS](https://github.com/kanasimi/CeJS#nodejs-usage) for detail.
2. Setup [_CeL.path.txt](https://github.com/kanasimi/CeJS/blob/master/_for%20include/_CeL.path.sample.txt) if necessary.
2. Setup [work_crawler_loder.config.js](https://github.com/kanasimi/work_crawler/blob/master/work_crawler_loder.config.js). 最後設定好 work_crawler_loder.config.js。例如指定 <code>global.data_directory</code>。

## Execution 執行
所有操作都必須進到工具檔所在的目錄，在命令行界面下執行。
1. 確認要下載的網站名與作品名。之後在命令行界面下，執行：

   ``` sh
   node 工具檔名.js "作品名" [option=true]
   ```

   e.g.,
   ``` sh
   cd comic.cmn-Hans-CN && node qq.js 狐妖小红娘 skip_error=true
   cd novel.cmn-Hans-CN && node 23us 斗罗大陆Ⅲ龙王传说
   cd comic.cmn-Hans-CN && node 2manhua 大主宰 recheck=true
   cd comic.cmn-Hans-CN && node ikanman l=ikanman.txt recheck=true
   cd novel.cmn-Hans-CN && echo "via id" && node 630book 267
   cd novel.ja-JP       && node yomou 転生したらスライムだった件
   ```

2. 下載的檔案將放在 <code>global.data_directory</code> 所設定的目錄下。若採[懶人安裝法](#nodejs-lazy-installation-懶人安裝法)，則預設放在解壓縮後工具檔所在的目錄下。
3. 若是下載出錯，**重新執行即可接續下載**。

## Workflow 工作流程
本工具將把所指定的漫畫下載至特定目錄中（預設為工具檔名，如 <code>manhuatai</code>），每套漫畫一個目錄。
![folder](https://lh3.googleusercontent.com/4ifQgcp8_tZoNW_Ml1V_XijWh1jMRbGcwlnLPs0CP_1AXOYfW4G-PFl3XZh7L7LPFMfrd92KeGxEXejjP7TYMXTP_g869gkeEo4RNC_fTBUxvf0jK3z2jZO6D_Fx6d5M65gLFksVGK5il4JjdOwgPpNuNMbpl92SmdGet0_npHDDZ7qDXCiThF9_BPCFznQpnZHXajfgtmCH25dJ03392dNC6XlI92E4N8m-P89YrTXqwD2IxVtgAfpA6FW0dce78ZEgso93bJLQoBQfUewzt7oG1NMg2LVigXN-5xJTtvJKawNxJsEVck8P450HoEVKZCGWb4auj8-RCp5NwLcQeshRIBbwaZUzru2LVPaY31q8TUCdRd-WjOgqVxQpHussYMf_7xU41Kek_bHjmKWZJUh6KQXo7hb-cMSfdACK_6_zcC51Kpgi2JgdvopJ9oTJM5fe5Ej_05W34z2RS1TvHdJANT7iPexiL1-HZxyW7Z-CK61Ngfkav5J8hwLa7oFhAewqSi8e-XayBkX5jhyvXj7V_VnEliXvq4Zmt2hKmIBaXcGSPoLr45pX6G8a5r8dxt0LYa0h5y5tjEQs_ztOG8hboTGKZBMsC2XWPf_FtoXDYEFe=w589-h386-no)

![folder inside work](https://lh3.googleusercontent.com/-kdAGIZkpWKnbx_Z1r5CIdhC_qEsc8RCxLqA9TUUtnPjx3FqT-j2vuY49Bjoz4kB-CvBo-ojDnhl7dbipRMTjuUc2cGzjPnWJxo7jbr5JD4X_mHdAz-t1gYABm6ng3Q87WF61JLkBFg5etrQPjVjiR83VUNlky8xbhBMfVEXoZKbc1LMptWyLyi_6ype_Tl3r5nd4oywpLc5qJ5cYS72BqXNFr0wtFwSlmETNzmlhGKPFjGjNUqkGFkrf7DeQJ7l_qSIBfj4oLPWb50IBwn5ECVU1wyGNgALzIAL1DIm4Hvyop2uEinZ2DPcyjv_i2Lkuwa21Mk4x6T_dU0V7gpy3MrE4pMI-9EznCuwMRrFba0VE3pGj8MSaW5z8snZLH9hYm6gh5cCMNfPOQhc1IPQh4ZP8qWDgEbeItVSuo1D9b4l1-2VhaXMNTzVcJ-MLcDLNDFM_Cxfpu5IOHwIlOlOMrr6nXeRdWHJkG5S7hunMFg30wh8gEl74zGmDMRGDlQiYgZYM7otHbaSSsSB8EGU8ZmBtf6xc4R5h3Q5cJ5u62Ozq5SNMGhnEqjvEbUvCSj__CMRDGKedAm6Ach0xgaPPEGfnhtq8am6mPPhWEK-aSBdh2ql=w225-h343-no)

![folder inside chapter](https://lh3.googleusercontent.com/FDLvxmXgUD4BqXcB2h5R3fil2CFcun0jgWwGusmyLWybXXHGDpMYc2Y4RDN0bDvxMB3h7WBMuq12Co0QQu63KFBoMx8ink8I6PGaWpgKzS6C0_ziiV-Vc_GfzBvpu5hDEAbMUo0BpSNodh9EhMj2tjZ_tdpIXwsBzI1IHDOvJvnWIDNpQ8o6XeZTWX7jmdBMH49ytOyVzVOAQTdnoCJndBhS9YDa_8GBhgh0DYMQQ49fu2bEqI6ZL33qdPUx9hKCIJr0Peo04lZm5Fe1FpXaAj4lzY2QwbIN__cD8AJcthXLciEAj2KeGCRwa8IbRq2vv17vrh4giOqeH-7kh8qMfjnetHNw6uyrjxy9X_LedVWyn9JzKUkGiSP2n9wadcATpxEEh48X2bhc5iboRy9sIDRiWuP6XBAMIN6shSsaMx4yvLlgKoiRZMJgj6zFd6pBH0LwM-FA3SI5LwoBz6sdRDqIOnEDewPc1eWiHPoam8xaJB5CFbeB2CHgl_AV6XzOB1bXVqsBK3gueuAb_VZ_iHbuovSlPNuTq_uKA2ZFG1Valqv_bL--6EByh2wDFuMcm0FUY6edHqzn6dsErbiVZ2dOUh0ntVfXMU2k5DiZ6dgfucY8=w333-h265-no)

接續下載時，將從上次的進度（最後下載的章節）接著下載。

![接續下載](https://lh3.googleusercontent.com/LMpFtmfIIeH3bCbM2DuEX_AJ2r17X-_OGM8O6EitrLYLRzqxYn0tt6CbjZciL1Hav60vDEXAMFILWviPu-wFjqfpuO_srKNKbVUVr-5XJ7wBm0J6r730vYVZ4Iun1Ug5tm7iRBK24kWZKAJwD6Fpx_WagdQji81k6yVvmMO-_KHx-UwaUtox2Z9CLQvpHG63XqAcoTJdob3_gBCyen82HNlmmQLMLFrvjvFeywYrR2YsOkem_fypz5jvM1UM9BS8Bd0WzkjQ5SoE_SNgF_EhOuESbTu_pmLjZL0OoZX0eAUisfcGnLptk0ea8eM4KqU3oOQhG44emNxuH31gQMHQiXVd-7-X2H_VK2IhlosyPQuObveuGv6C0fjNJmoJdEFjPPlZVx25JuGJZe_PfRkdkoliNHcn5UMaqp8YiTF7wvGOktLnE2OBJXx7DuvUzjO2VY8aoebwdRjJI9ft-Co0zIe1AZUW0rcmrWROqFJNTHYNoLyVo_lmxgw_THlgv1GaY5BhKfKOXC_Zx-n6ye_xtQgO-wxSgDaCvBPuE7G8VMGdYyl-12LLa1IKROtqjfVePilpWRsWq5tO1SnCb1rn2ulDoF9cxlIo3yKMtpdWCCppM9ro=w745-h481-no)

![小說 → epub list](https://lh3.googleusercontent.com/E1IHu14DmtTyB5FO090wrAQ2szVB3TxUIQAuQfqklRITRA-zE6r8aG22nSAFQvRpncooGCN_q9Lym1bsOaCSrFY9Yadvapzjkqbi9F4iQIBV_IgZUKMB5tURe9B_XtOikcQ4lTg4dBhZPnCI1w-cM9J4rdyg3jvXpej-vT3AZyFQJZUDBLOCEKmRCvt9va1XZslmkPTjegDD2XxZ_Eff6KGRVaLXUyOfqngT-EGwV2Wn82AN20bgmw3yVRjLWzzzKHTT3ZR46QWhHskR_3QcfWwOJZN8nLTmXZVXfuL3EbXKh5xEVUZnUc-HeOxUSp6QIEQlowCZu5jKW8d2YQtiP1xnmabDk4VpuNWVYRWHrgAdb8ahE-e7EPU0iuj40lTrUJ4rxOSp9G35AtYDFDy33GOOsxXvv1UO2KitCXp56vfdjyuOPZL0-vLdJIJ41aJ8RBhsaOlxhiWfLA9AqaNoUOWBojx-6CiSLFc6iisiSWk30r9x2rf-4eDYiB_UmvHlLpZCIIci3YAyREy2cqJ-QQSC76gphXoQh4RPW4ThAX_rAEmh4mfgojmTvgDJqdZCtC103CJASBcJYvt1ZpBDuLSfzdRZF64VaOynO6ln9trimMjTI6fc6zUIL-GR_7wtEsnVKwLthalI-0qMlEf0Og3MHs8D6wkkthrzmu5WyzZG6g=w1366-h738-no)

![小說 → epub](https://lh3.googleusercontent.com/zXxohSbIAwXJuNdmq039hPVTPrFGf_DTUbhVzrIGNjr_9MT08ATuOsi6eMS1kTNlEt502dQeWNGCnRl8_kM6sWMrsTH8LINnKg7IiMxRj7wF4TR-Tpbt_fVVtHyI_lApDUUG_niDE4ZUphSRCTccLMiKAl3TW7qHqg6PsO4LxkntcF6VG3RPx7d2gb7mBSe-W9_06c3-Zaaq9npqpx8I2Yx5egYbwIT2T7Rsuw3WoeGN153SqrfJpeMQudvQeNbU7DREdqWT3g664Eqhfi73JI2YVPsyL5ntIlHuPTvGnOFCV5o1Qh2SlRMs0q2uVZs3PfkTc81ea0sO6eROnLGxJI3_2gRqVYlp8zkaPymo-t0mlcdcXj-dOuvke9o7ckqa-8-8JyTyzPWUZvZVdEVEI3FS-nv1aoDOs169xZnPuz1yYt0IoKS1LwObYYW6KMzTNAi-fCp7JNvtMzKZRy6aI9PbwDfEY0S178aaF_A6-p7udFtsb31Dy11j4BmT911wiYwPCNbRRJqWA0AaLJIcetC0jjY-BugWLqePsVZTgzNocwMIUe8xj54kZOy9aD4mckFXXkS9BHnwbr0096nQQ5GduKGQATSRvdSFfSu-ttOMZExz0DKcxyKimPiir7KZ-jzMUMbW9F3AS4mn2lKsTdRwhtieux10ojXq6Pdqap8VIA=w1366-h738-no)

## Note 附注
* 一般約需2至4小時新增或更新一網站，以達初步可用狀態。
* 小說作品採用單線程下載，以避免對網站造成過度的負荷。漫畫作品則以章節為單位多線程下載，每個章節的圖片下載完畢之後，再接著下一個章節。

## Purpose 公開目的
* 示範如何使用 [CeJS](https://github.com/kanasimi/CeJS) 之 [work_crawler module](https://github.com/kanasimi/CeJS/blob/master/application/net/work_crawler.js) 批量下載各線上小說漫畫網站。
* 展示程式撰寫當時，各線上小說漫畫網站之網站資料結構。
* 提供離線瀏覽小說漫畫功能，以利個人化閱覽方式。增進閱覽體驗、掌控閱覽環境。
* 增加對閱讀權的掌控能力，預防數十年後找不到記憶中閱覽過的作品。

非常歡迎[提供使用意見與改善建議](https://github.com/kanasimi/work_crawler/issues/new)。

## Announce 聲明
* 本工具僅供同好學習和研究，嚴禁傳播或用於任何商業、非法用途！請小心利用本工具。所下載或備分之內容版權屬原作者所有，請勿公開散布傳播。利用本工具可能引起的任何糾紛或損失損害，本人恕不負責。
* 各漫畫網站往往不時更改結構，同時造成本工具無法作動；因此若是有無法正常運作的情況請見諒，這通常得要更改原始碼方能回復正常。

## Uninstallation 移除
* 要移除本工具，只需將解壓縮後工具檔所在的目錄整個刪除即可。
* 圖片檔與紀錄檔的目錄需另外手動刪除。

<!--
TODO:
one-click installation + auto-update
GUI

-->
