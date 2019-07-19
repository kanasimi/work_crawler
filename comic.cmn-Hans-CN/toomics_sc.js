/**
 * 批量下載 Toomics 玩漫 漫画 的工具。 Download toomics comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.toomics');

// ----------------------------------------------------------------------------

var crawler = CeL.toomics({
	LANG_PREFIX : 'sc'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
