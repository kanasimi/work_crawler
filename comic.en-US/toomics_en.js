/**
 * 批量下載 Toomics - Free comics 的工具。 Download toomics comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.toomics');

// ----------------------------------------------------------------------------

var crawler = CeL.toomics({
	LANG_PREFIX : 'en'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
