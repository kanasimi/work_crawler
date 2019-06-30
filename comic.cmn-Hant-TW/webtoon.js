/**
 * 批量下載 WEBTOON 中文官網 韓國漫畫 的工具。 Download NAVER WEBTOON comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.webtoon');

// ----------------------------------------------------------------------------

var crawler = CeL.webtoon({
	// https://www.webtoons.com/zh-hant/
	language_code : 'zh-hant',

	// 規範 work id 的正規模式；提取出引數中的作品id 以回傳。
	extract_work_id : function(work_information) {
		if (CeL.is_digits(work_information)
		// e.g., webtoon 投稿新星專區 id 下載: "challenge_00000"
		|| /^([a-z]+)_(\d+)$/.test(work_information))
			return work_information;
	},

	// 2018/10: 投稿新星專區 用預設方法(callback var API)搜尋不到，得要用網頁的方法。
	search_URL : 'search?keyword=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		// <h3 class="search_result">投稿新星專區作品 (1個結果)</h3>
		html = html.between('"search_result"',
		// <div class="ranking_lst search">
		'"ranking_lst search"');

		var id_list = [], id_data = [];
		html.each_between('<li>', '</li>', function(token) {
			// console.log(token);
			var matched = token
			// e.g., <a href="/challenge/episodeList?titleNo=211344"
			.match(/(?:\/([a-z]+)\/)?episodeList\?titleNo=(\d+)/);
			id_list.push(matched[1] ? matched[1] + '_' + matched[2]
					: +matched[2]);
			id_data.push(get_label(token.between('<p class="subj">', '</p>')));
		});

		return [ id_list, id_data ];
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
