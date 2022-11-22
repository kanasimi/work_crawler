/**
 * 批量下載包子漫畫的工具。 Download baozimh comics.
 * 
 * @since 2022/11/3 5:55:24
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.baozimh');

// ----------------------------------------------------------------------------

var crawler = new CeL.baozimh({
	base_URL : 'https://www.baozimh.com/'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
