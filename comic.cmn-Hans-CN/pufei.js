/**
 * 批量下載 扑飞漫画 的工具。 Download pufei comics.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.qTcms2014');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2014({
	base_URL : 'http://www.pufei.net/',

	postfix_image_url : function(url) {
		// @see function loadview() @ /skin/2014mh/view.js
		return 'http://res.img.pufei.net/' + url;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
