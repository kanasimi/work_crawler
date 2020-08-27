/**
 * @name CeJS online novels / comics downloader configuration. CeJS 網路小說漫畫下載工具的主要設定。
 * @fileoverview ** This file is private. Please fill the data and rename this file to "work_crawler.configuration.js".
 * 
 * 請注意：請別直接改變 `work_crawler.default_configuration.js` 的設定。
 * 這個檔案在每次更新時，都會被覆寫成新版本的預設設定。若欲更改設定，請編輯 `work_crawler.configuration.js`
 * 這個檔案，不要編輯 `work_crawler.default_configuration.js`！
 */

'use strict';

// default directory to place comic images and novels.
// 指定所有網站採用之預設主要下載目錄，所下載的作品檔案預設會放置到此主要目錄之工具檔名稱底下。
// 請記得在引號中，目錄分隔號必須輸入兩次！
// '': the same directory as the .js running,
// or default download location of user.
globalThis.data_directory = '';

// 設定是否開啟自動更新功能。
globalThis.auto_update = true;

// npm: 若有 CeJS module 則用之。
globalThis.use_cejs_mudule = true;

// ------------------------------------

// 代理伺服器 "hostname:port"
globalThis.proxy_server = '';

/** {String|Function}儲存最愛作品清單的目錄。可以把最愛作品清單放在獨立的檔案，便於編輯。 */
globalThis.favorite_list_directory = '';
// 儲存最愛作品清單的目錄 @ .main_directory。
favorite_list_directory = function() {
	return this.main_directory + 'favorite.txt';
};

/** {String|Function}當只輸入 "l" 時的轉換。 */
globalThis.default_favorite_list = '';

// ------------------------------------
// configuration for arrangement/*.js

// default directory to place completed files
// 將會被指定為第一個存在的目錄。
globalThis.completed_directory = [ '', '' ];

// 檔案分類完後要放置的標的目錄。
globalThis.catalog_directory = '';

// ------------------------------------
// 各個網站獨特的設定/特別的個人化設定。
globalThis.site_configuration = {};

// comico 搭配閱讀卷示範
site_configuration.comico = site_configuration.comico_jp = site_configuration.comico_jp_plus = {
	// 讓本工具自動使用閱讀卷。警告:閱讀券使用完就沒了。不可回復。
	// auto_use_ticket : true,
	// 警告:帳號資訊是用明碼存放在檔案中。
	loginid : '',
	password : ''
};

// ニコニコ静画を利用する為にはniconicoのアカウントが必要です。
site_configuration.nico_seiga = {
	mail_tel : '',
	// 警告:帳號資訊是用明碼存放在檔案中。
	password : ''
};
