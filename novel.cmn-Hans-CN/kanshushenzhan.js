/**
 * 批量下載 看书神站 小說 的工具。 Download kanshushenzhan novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.jieqi_article');

// ----------------------------------------------------------------------------

// <br />
// &nbsp;&nbsp;&nbsp;&nbsp;本站重要通知:请使用百度搜索“看书神站”,无广告、破防盗版、更新快,会员同步书架,请
// gegegengxin (按住三秒复制) !!<br />阅读<a href="/132800/">万古剑神</a>最新章节，就上<a
// href="/">看书神站！</a></p>
var PATTERN_ads = /(?:<br \/>\n(?:&nbsp;)*本站重要通知:[^<>]+)?<br \/>阅读<a href="[^<>"]+">[^<>]+<\/a>最新章节，就上<a href="\/">看书神站！<\/a>$/,
//
crawler = CeL.jieqi_article({

	base_URL : 'https://www.kanshushenzhan.com/',

	// 去掉前後網站廣告。
	remove_ads : function(text) {
		return text.replace(PATTERN_ads, '');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
