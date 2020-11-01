/**
 * 批量下載アルファポリス - 電網浮遊都市 - 公式漫画的工具。 Download AlphaPolis official manga.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.AlphaPolis');

// ----------------------------------------------------------------------------

var crawler = CeL.AlphaPolis({
	// 當網站不允許太過頻繁的訪問/access時，可以設定下載之前的等待時間(ms)。
	// 模仿實際人工請求。
	// chapter_time_interval : '5s',

	work_type : 'manga/official',

	// 取得作品的章節資料。 get_work_data()
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between(
			// 2019/1/21 アルファポリス 公式漫画 改版
			'<div class="manga-detail-description', '</div>')
			// <div class="manga-detail-description section"> <div
			// class="title"> <h1>title</h1> </div>
			.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			// e.g., 连载中, 連載中
			// <div class="wrap-content-status">
			status : html.between('<div class="status">', '</div>').split(
					'</span>').map(get_label),
			author : get_label(html.between('<div class="author-label">',
					'</a>')),
			last_update : get_label(html.between('<div class="up-time">',
					'</div>')),
			next_update : get_label(html
			// <span class="next-up-time">
			.between(' class="next-up-time">', '<')),
			description : get_label(html.between('<div class="outline">',
					'</div>')),
			// site_name : 'アルファポリス'
			language : 'ja-JP'

		};

		// console.log(html);
		extract_work_data(work_data, html);

		work_data.status = work_data.status.concat(
				html.between(' class="manga-detail-tags', '</div>')
						.between('>').split('</a>').map(get_label))
		//
		.filter(function(tag) {
			return !!tag;
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html) {
		work_data.chapter_list = [];
		// <a data-order="34" class="episode RentalContent"
		// <a data-order="35" class="episode "
		html = html.between('<div class="episode', '<div class="scroll')
		// <div class="scroll scroll-up" id="ScrollUp"><img
		// src="/img/official_manga/under_arrow.svg?1543454323"
		// alt="最上部へ"/></div>
		.between('>');

		// <div data-order="0000" class="episode-unit">...</div>
		html.each_between(' class="episode-unit">', null, function(text) {
			// console.log(JSON.stringify(text));
			var chapter_data = {
				// <div class="title">第1回</div>
				title : text.between(' class="title">', '</'),
				url : '/manga/official/'
						+ text.between(' href="/manga/official/', '"'),
				date : text.between('<div class="up-time">', '</div>')
				//
				.replace('更新', ''),
				// <span class="likes-count">1,690</span>
				likes : text.between(' class="likes-count">', '</'),
				// <span class="comments-count">4</span>
				comments : text.between(' class="comments-count">', '</'),
				// <div class="rental-coin">70AC</div>
				limited : text.between(' class="rental-coin">', '</'),
				// <div class="volume"> 1巻収録 </div>
				// <div class="volume">13巻収録</div>
				収録 : text.between(' class="volume">', '</')
			};
			// console.log(chapter_data);
			work_data.chapter_list.push(chapter_data);
		});
		work_data.chapter_list.reverse();
		// console.log(work_data.chapter_list);
	}

});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
