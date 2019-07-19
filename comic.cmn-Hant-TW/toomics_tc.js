/**
 * 批量下載 Toomics 玩漫 - 免費網路漫畫 的工具。 Download toomics comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.toomics');

// ----------------------------------------------------------------------------

var crawler = CeL.toomics({
	LANG_PREFIX : 'tc'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
