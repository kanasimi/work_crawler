/**
 * 批量下載 KADOKAWA CORPORATION webエース TYPE-MOONコミックエース 的工具。 Download TYPE-MOON
 * comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.ace');

// ----------------------------------------------------------------------------

var crawler = CeL.ace({
	// CeL.get_script_name()
	site : 'tmca'
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
