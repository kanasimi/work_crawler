/**
 * 批量下載 漫画1234 的工具。 Download mh1234 comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.SinMH');

// ----------------------------------------------------------------------------

var crawler = CeL.SinMH({
	// 循序逐個、一個個下載圖像。僅對漫畫有用，對小說無用。小說章節皆為逐個下載。 Download images one by one.
	// one_by_one : true,

	// e.g., mh1234\8504 龙飞不败\0011 第11卷\8504-11-001 bad.jpg
	skip_error : true,

	// 似乎無此API
	try_to_get_blocked_work : false,

	// https://www.mh1234.com/assets/d74ff3d8/js/theme.js
	// Created by Shen.L on 2016/1/28.
	// SinMH.initChapter, SinTheme.initChapter, SinConf.resHost
	base_URL : 'https://www.mh1234.com/',

	work_URL : function(work_id) {
		return 'comic/' + work_id + '.html';
	},

	// modify from 733mh.js: for https://www.mh1234.com/
	get_chapter_list : function(work_data, html, get_label) {
		var latest_chapter_list = work_data.chapter_list;

		var text = html.between('<div class="w980_b1px mt10 clearfix">',
				'<div class="introduction" id="intro1">').between('<ul',
				'</ul>');
		// console.log(text);

		/**
		 * e.g., <code>

		// 733mh.js
		<li><a href="/mh/27576/359123.html" title="179：失踪">179：失踪</a></li>

		// mh1234.js
		<li>
		<a  href="/comic/12549/554098.html">第1话：周家圣龙（上）<i></i></a>
		</li>

		</code>
		 */
		work_data.chapter_list = [];
		work_data.inverted_order = false;
		var matched, PATTERN_chapter =
		// [ , chapter_url, chapter_title ]
		/<a\s+href="(\/comic\/[^<>"]+)">([\s\S]+?)<\/a>/g;
		while (matched = PATTERN_chapter.exec(text)) {
			work_data.chapter_list.push({
				url : matched[1],
				title : get_label(matched[2])
			});
		}
		// console.log(work_data);

		this.check_filtered(work_data, html, get_label,
		//
		latest_chapter_list);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
