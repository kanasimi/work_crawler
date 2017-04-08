# Online novel / comic downloader 小說漫畫下載工具
- [en] Download novels→epub and comics with command line interface.
- [TW] 批量下載小說→epub、漫畫網站的工具。命令行界面。
- [CN] 批量下载小说→epub、漫画网站的工具。命令行界面。
- [ja] ウェブ小説→epub、ウェブ漫画作品を一括ダウンロードツール。コマンドラインインターフェース。

## Completed tools 已完成網站工具
已撰寫完的各大工具網站包括:

### novels 小說
web pages → epub
* [アルファポリス](http://www.alphapolis.co.jp/) : AlphaPolis.js
* [カクヨム](https://kakuyomu.jp/) : kakuyomu.js
* [ハーメルン](https://syosetu.org/) : Hameln.js
* [小説家になろう](http://syosetu.com/) / 小説を読もう！ yomou.js , ノクターンノベルズ noc.js

### comics 漫畫
web pages → folder
* [腾讯漫画](http://ac.qq.com/) : qq.js
* [爱看漫画](http://www.ikanman.com/) : ikanman.js
* [漫画台](http://www.manhuatai.com/) : manhuatai.js
* [爱漫画](http://www.2manhua.com/) : 2manhua.js
* [热漫吧](http://www.remanba.com/) : remanba.js (自 2016/12/27 14:42 最後一次成功連接後，下午起就持續 404 至 2017/2/10 未復原。)
* [三七阅读](http://www.37yue.com/) : 37yue.js
<!--
| Site | Tool file | Note |
| --- | --- | --- |
| [アルファポリス](http://www.alphapolis.co.jp/) | AlphaPolis.js | |
| [カクヨム](https://kakuyomu.jp/) | kakuyomu.js | |
| [ハーメルン](https://syosetu.org/) | Hameln.js | |
| [小説家になろう](http://syosetu.com/) | 小説を読もう！ yomou.js , ノクターンノベルズ noc.js | |
| [腾讯漫画](http://ac.qq.com/) | qq.js | |
| [爱看漫画](http://www.ikanman.com/) | ikanman.js | |
| [漫画台](http://www.manhuatai.com/) | manhuatai.js | |
| [爱漫画](http://www.2manhua.com/) | 2manhua.js | |
| [热漫吧](http://www.remanba.com/) | remanba.js | (自 2016/12/27 14:42 最後一次成功連接後，下午起就持續 404 至 2017/2/10 未復原。) |
| [三七阅读](http://www.37yue.com/) | 37yue.js | |
-->

## Installation

### 懶人安裝法
為了只想趕快試用的你～
1. 先安裝 [node.js](https://nodejs.org/)
2. 下載並解壓縮[本工具](https://github.com/kanasimi/comic/archive/master.zip)
3. 現在起的操作都必須進到解壓縮後的目錄，在命令行界面下執行。先執行：<code>npm install cejs && move "comic loder.sample.js" "comic loder.js"</code> <!-- 可能將 cejs 安裝在此目錄下之 node_modules/cejs 目錄內 -->

### Normal installation
1. Please see [Node.js usage section at CeJS](https://github.com/kanasimi/CeJS#nodejs-usage) for detail.
2. Setup [_CeL.path.txt](https://github.com/kanasimi/CeJS/blob/master/_for%20include/_CeL.path.sample.txt) if necessary.
2. Setup [comic loder.js](https://github.com/kanasimi/comic/blob/master/comic%20loder.sample.js). 最後設定好 comic loder.js。

## Execution
1. 確認要下載的網站名與作品名。之後在命令行界面下，執行：
``` sh
$ node 工具檔名.js "作品名"
```
e.g., 
``` sh
$ node qq 狐妖小红娘
$ node yomou 転生したらスライムだった件
```
2. 下載的檔案將放在 <code>comic loder.js</code> 所設定的目錄下。若採懶人安裝法，則預設放在解壓縮後的目錄下。

## Workflow 工作流程
本工具將把所指定的漫畫下載至特定目錄中（預設為工具檔名，如 <code>manhuatai</code>），每套漫畫一個目錄。
![folder](https://lh3.googleusercontent.com/4ifQgcp8_tZoNW_Ml1V_XijWh1jMRbGcwlnLPs0CP_1AXOYfW4G-PFl3XZh7L7LPFMfrd92KeGxEXejjP7TYMXTP_g869gkeEo4RNC_fTBUxvf0jK3z2jZO6D_Fx6d5M65gLFksVGK5il4JjdOwgPpNuNMbpl92SmdGet0_npHDDZ7qDXCiThF9_BPCFznQpnZHXajfgtmCH25dJ03392dNC6XlI92E4N8m-P89YrTXqwD2IxVtgAfpA6FW0dce78ZEgso93bJLQoBQfUewzt7oG1NMg2LVigXN-5xJTtvJKawNxJsEVck8P450HoEVKZCGWb4auj8-RCp5NwLcQeshRIBbwaZUzru2LVPaY31q8TUCdRd-WjOgqVxQpHussYMf_7xU41Kek_bHjmKWZJUh6KQXo7hb-cMSfdACK_6_zcC51Kpgi2JgdvopJ9oTJM5fe5Ej_05W34z2RS1TvHdJANT7iPexiL1-HZxyW7Z-CK61Ngfkav5J8hwLa7oFhAewqSi8e-XayBkX5jhyvXj7V_VnEliXvq4Zmt2hKmIBaXcGSPoLr45pX6G8a5r8dxt0LYa0h5y5tjEQs_ztOG8hboTGKZBMsC2XWPf_FtoXDYEFe=w589-h386-no)

![folder inside work](https://lh3.googleusercontent.com/-kdAGIZkpWKnbx_Z1r5CIdhC_qEsc8RCxLqA9TUUtnPjx3FqT-j2vuY49Bjoz4kB-CvBo-ojDnhl7dbipRMTjuUc2cGzjPnWJxo7jbr5JD4X_mHdAz-t1gYABm6ng3Q87WF61JLkBFg5etrQPjVjiR83VUNlky8xbhBMfVEXoZKbc1LMptWyLyi_6ype_Tl3r5nd4oywpLc5qJ5cYS72BqXNFr0wtFwSlmETNzmlhGKPFjGjNUqkGFkrf7DeQJ7l_qSIBfj4oLPWb50IBwn5ECVU1wyGNgALzIAL1DIm4Hvyop2uEinZ2DPcyjv_i2Lkuwa21Mk4x6T_dU0V7gpy3MrE4pMI-9EznCuwMRrFba0VE3pGj8MSaW5z8snZLH9hYm6gh5cCMNfPOQhc1IPQh4ZP8qWDgEbeItVSuo1D9b4l1-2VhaXMNTzVcJ-MLcDLNDFM_Cxfpu5IOHwIlOlOMrr6nXeRdWHJkG5S7hunMFg30wh8gEl74zGmDMRGDlQiYgZYM7otHbaSSsSB8EGU8ZmBtf6xc4R5h3Q5cJ5u62Ozq5SNMGhnEqjvEbUvCSj__CMRDGKedAm6Ach0xgaPPEGfnhtq8am6mPPhWEK-aSBdh2ql=w225-h343-no)

![folder inside chapter](https://lh3.googleusercontent.com/FDLvxmXgUD4BqXcB2h5R3fil2CFcun0jgWwGusmyLWybXXHGDpMYc2Y4RDN0bDvxMB3h7WBMuq12Co0QQu63KFBoMx8ink8I6PGaWpgKzS6C0_ziiV-Vc_GfzBvpu5hDEAbMUo0BpSNodh9EhMj2tjZ_tdpIXwsBzI1IHDOvJvnWIDNpQ8o6XeZTWX7jmdBMH49ytOyVzVOAQTdnoCJndBhS9YDa_8GBhgh0DYMQQ49fu2bEqI6ZL33qdPUx9hKCIJr0Peo04lZm5Fe1FpXaAj4lzY2QwbIN__cD8AJcthXLciEAj2KeGCRwa8IbRq2vv17vrh4giOqeH-7kh8qMfjnetHNw6uyrjxy9X_LedVWyn9JzKUkGiSP2n9wadcATpxEEh48X2bhc5iboRy9sIDRiWuP6XBAMIN6shSsaMx4yvLlgKoiRZMJgj6zFd6pBH0LwM-FA3SI5LwoBz6sdRDqIOnEDewPc1eWiHPoam8xaJB5CFbeB2CHgl_AV6XzOB1bXVqsBK3gueuAb_VZ_iHbuovSlPNuTq_uKA2ZFG1Valqv_bL--6EByh2wDFuMcm0FUY6edHqzn6dsErbiVZ2dOUh0ntVfXMU2k5DiZ6dgfucY8=w333-h265-no)

接續下載時，將從上次的進度（最後下載的章節）接著下載。

![接續下載](https://lh3.googleusercontent.com/LMpFtmfIIeH3bCbM2DuEX_AJ2r17X-_OGM8O6EitrLYLRzqxYn0tt6CbjZciL1Hav60vDEXAMFILWviPu-wFjqfpuO_srKNKbVUVr-5XJ7wBm0J6r730vYVZ4Iun1Ug5tm7iRBK24kWZKAJwD6Fpx_WagdQji81k6yVvmMO-_KHx-UwaUtox2Z9CLQvpHG63XqAcoTJdob3_gBCyen82HNlmmQLMLFrvjvFeywYrR2YsOkem_fypz5jvM1UM9BS8Bd0WzkjQ5SoE_SNgF_EhOuESbTu_pmLjZL0OoZX0eAUisfcGnLptk0ea8eM4KqU3oOQhG44emNxuH31gQMHQiXVd-7-X2H_VK2IhlosyPQuObveuGv6C0fjNJmoJdEFjPPlZVx25JuGJZe_PfRkdkoliNHcn5UMaqp8YiTF7wvGOktLnE2OBJXx7DuvUzjO2VY8aoebwdRjJI9ft-Co0zIe1AZUW0rcmrWROqFJNTHYNoLyVo_lmxgw_THlgv1GaY5BhKfKOXC_Zx-n6ye_xtQgO-wxSgDaCvBPuE7G8VMGdYyl-12LLa1IKROtqjfVePilpWRsWq5tO1SnCb1rn2ulDoF9cxlIo3yKMtpdWCCppM9ro=w745-h481-no)

若是下載出錯，重新執行即可接續下載。

## Purpose 公開目的
* 示範如何使用 [CeJS](https://github.com/kanasimi/CeJS) 之 [comic module](https://github.com/kanasimi/CeJS/blob/master/application/net/comic.js) 批量下載各漫畫網站。
* 展示程式撰寫當時，各漫畫網站之網站資料結構。
* 提供離線瀏覽漫畫功能，以利個人化閱覽方式。
* 增加對閱讀權的掌控能力，預防數十年後找不到記憶中閱覽過的作品。

非常歡迎提供使用意見與改善建議。

## Announce 聲明
* 本工具僅供同好學習和研究，嚴禁傳播或用於任何商業、非法用途！請小心利用本工具。所下載或備分之內容請勿公開散布傳播。利用本工具可能引起的任何糾紛或損失損害，本人恕不負責。
* 各漫畫網站往往不時更改結構，同時造成本工具無法作動；因此若是有無法正常運作的情況請見諒，這通常得要更改原始碼方能回復正常。
