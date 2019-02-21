/**
 * 批量下載 追书帮 小說 的工具。 Download zhuishubang novels.
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.jieqi_article');

// ----------------------------------------------------------------------------

// 本↘书↘首↘发↘追↘书↘帮↘http://m.zhuishubang.com/
var PATTERN_ads = /免-费-首-发→【追】【书】【帮】|★首发追书帮★|★看★最★新★章★节★百★度★搜★追★书★帮★|本↘书↘首↘发↘追↘书↘帮↘http:[a-z.\/]+/g,
//
crawler = CeL.jieqi_article({

	base_URL : 'http://www.zhuishubang.com/',

	inverted_order : true,

	// 去掉前後網站廣告。
	remove_ads : function(text) {
		return text.replace(PATTERN_ads, '');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
