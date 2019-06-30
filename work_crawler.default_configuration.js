/**
 * CeJS 線上小說漫畫下載工具的主要設定。
 * 
 * 請注意：`work_crawler.default_configuration.js`
 * 這個檔案每次更新都會被覆寫成新版本，若欲更改設定，請編輯 `work_crawler.configuration.js` 這個檔案，不要編輯
 * `work_crawler.default_configuration.js`！
 */

// default directory to place comic images and novels. 指定下載的檔案要放置的標的目錄。
// '': the same directory as the .js running, or default download location of
// user.
global.data_directory = '';

// 自動更新功能。
global.auto_update = true;

// npm: 若有 CeJS module 則用之。
global.use_cejs_mudule = true;

// ------------------------------------
// configuration for arrangement/*.js

// ** 請別直接改變這邊的設定。在每次更新時，本檔案可能會被覆寫為預設設定。

// default directory to place completed files
// 將會被指定為第一個存在的目錄。
global.completed_directory = [ '', '' ];

// 檔案分類完後要放置的標的目錄。
global.catalog_directory = '';

// 各個網站獨特的設定/特別的個人化設定。
global.site_configuration = {};

// comico 搭配閱讀卷示範
site_configuration.comico = site_configuration.comico_jp = site_configuration.comico_jp_plus = {
	// 讓本工具自動使用閱讀卷。警告:閱讀券使用完就沒了。不可回復。
	// auto_use_ticket : true,
	// 警告:帳號資訊是用明碼存放在檔案中。
	loginid : '',
	password : ''
};

// 代理伺服器 "hostname:port"
global.proxy_server = '';

/** {String|Function}儲存最愛作品清單的目錄。可以把最愛作品清單放在獨立的檔案，便於編輯。 */
global.favorite_list_directory = '';
// 儲存最愛作品清單的目錄 @ .main_directory。
favorite_list_directory = function() {
	return this.main_directory + 'favorite.txt';
};

/** {String|Function}當只輸入 "l" 時的轉換。 */
global.default_favorite_list = '';
