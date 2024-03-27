/**
 * 批量下載 翠微居 的工具。 Download cwjjj novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// CeL.detect_HTML_language()
, 'application.locale' ]);

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節與所有圖片。不會重新擷取圖片。對漫畫應該僅在偶爾需要從頭檢查時開啟此選項。default:false
	// recheck='changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。否則只會自上次下載過的章節接續下載。
	// recheck : 'changed',

	// 搜索间隔: 30 秒
	search_work_interval : '40s',
	// chapter_time_interval : '2s',

	// 2023/9/26前: https://www.cwjjj.com/
	// 2024/3/10: https://www.cwjx8.com/
	base_URL : 'https://www.cwjx8.com/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ 'search/', {
			searchkey : work_title,
			searchtype : 'all',
			Submit : ''
		} ];
	},
	parse_search_result : function(html, get_label) {
		if (!html.includes('<li class="searchresult">'))
			console.log(html);

		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];

		html.each_between('<li class="searchresult">', '</li>', function(text) {
			var matched = text.match(
			// <a href="/book/18436/"><h3><span
			// class="hot">我只想安静的做个苟道中人</span>（精校反和谐加料版）</h3></a>
			/<a href="\/book\/(\d+)\/"><h3>([\s\S]+?)<\/a>/);
			id_list.push(matched[1]);
			id_data.push(get_label(matched[2]));
		});

		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'book/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.trace(html);
		if (!this.site_name) {
			// <footer class="container">
			// <p><i class="fa fa-flag"></i>&nbsp;<a
			// href="/">翠微居</a>&nbsp;书友最值得收藏的网络小说阅读网</p>
			this.site_name = get_label(html.between(
					'<footer class="container">').between('<a ', '</a>')
					.between('>'));
		}
		var text = html.between('<div class="container">');
		// console.log(text);
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			/**
			 * <code>

			<div class="container">
			<section class="section">
			<div class="novel_info_main">
			    <img src="https://i.xsscw.com/18/18436/18436s.jpg" alt="我只想安静的做个苟道中人（精校反和谐加料版）" />
			    <div class="novel_info_title">
			        <h1>我只想安静的做个苟道中人（精校反和谐加料版）</h1><i>作者：<a href="/author/%E7%88%86%E7%82%B8%E5%B0%8F%E6%8B%BF%E9%93%81/">爆炸小拿铁</a></i>
			        <p>
			            <span>修真小说</span><span>288 万字</span>
			            <span>连载</span>
			        </p>

			</code>
			 */
			title : get_label(text.between('<h1>', '</h1>')),

			// 選擇性屬性：須配合網站平台更改。
			description : get_label(text.between('<div class="intro">',
					'</div>')),
			tags : text.between('<p>', '</p>').all_between('<span>', '</span>')
					.map(function(text) {
						return get_label(text);
					}),
			image : text.between('<img src="', '"')
		};

		// 由 meta data 取得作品資訊。
		extract_work_data(work_data, html);

		work_data.last_update = work_data.update_time;

		// console.log(html);
		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<ul id="ul_all_chapters">', '</ul>');

		// reset work_data.chapter_list
		work_data.chapter_list = [];
		html.each_between('<li', '</li>', function(text) {
			var matched = text
					.match(/<a href="([^<>"]+)"[^<>]*>([\s\S]+?)<\/a>/);
			var chapter_data = {
				url : matched[1],
				title : get_label(matched[2])
			};
			crawler.add_chapter(work_data, chapter_data);
		});
		// console.log(work_data.chapter_list);
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);

		html = html.between('<div class="txtnav">') || html;
		this.check_next_chapter(work_data, chapter_NO, html);

		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		chapter_data.title = get_label(html.between('chapter_name" content="',
		// <meta property="og:novel:chapter_name" content="第1章 智能修真系统竭诚为您服务！">
		'"')) || chapter_data.title;

		var text = html.between('<article id="article" class="content">',
				'</article>');
		/**
		 * <code>
		<span><i class="fa fa-clock-o"> 1个月前</i></span>
		</code>
		 */
		if (false) {
			chapter_data.date = get_label(html.between(
					'<i class="fa fa-clock-o">', '</span>'));
		}

		text = CeL.work_crawler.fix_general_censorship(text);

		// text = CeL.work_crawler.fix_general_ADs(text);
		// console.trace([ html, text ]);
		this.add_ebook_chapter(work_data, chapter_NO, text);
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
