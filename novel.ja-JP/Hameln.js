/**
 * 批量下載 ハーメルン - SS･小説投稿サイト- 小説的工具。 Download Hameln novels.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run([ 'application.storage.EPUB'
// .to_file_name()
, 'application.net',
// CeL.detect_HTML_language()
, 'application.locale' ]);

var crawler = new CeL.work_crawler({
	// auto_create_ebook, automatic create ebook
	// MUST includes CeL.application.locale!
	need_create_ebook : true,
	// recheck:從頭檢測所有作品之所有章節。
	// 'changed': 若是已變更，例如有新的章節，則重新下載/檢查所有章節內容。
	recheck : 'changed',

	base_URL : 'https://syosetu.org/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : '?mode=search&word=',
	parse_search_result : function(html, get_label) {
		// console.log(html);
		var id_data = [],
		// {Array}id_list = [id,id,...]
		id_list = [];
		html.each_between('<div class="float hide blo_title_base">', '</a>',
		//
		function(text) {
			id_list.push(
			// e.g., <a href="//syosetu.org/novel/0000/"><b>title</b></a>
			// 2019/1 才發現已經過時: <a href="//novel.syosetu.org/0000/">"
			text.between(' href="//syosetu.org/novel/', '/"') | 0);
			id_data.push(get_label(text));
		});
		return [ id_list, id_data ];
	},
	convert_id : {
		r18 : function(callback) {
			CeL.info('これ以降はR-18小説と見なされる。');
			this.search_URL = '?mode=search_r18cs&word=';
			callback();
		}
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		// 小説情報
		return '?mode=ss_detail&nid=' + work_id;
	},
	parse_work_data : function(html, get_label) {
		var matched = html.match(/<!-- ヘッダ終了 -->([^<>]*)$/);
		if (matched) {
			// e.g., この小説は非公開設定になっています。
			throw matched[1].trim();
		}

		// <table class="table1">
		// <table width=100% class=table1>
		html = html.between('<table class="table1">', '</div>');
		var work_data = Object.create(null), PATTERN =
		// 2019/3/10 ハーメルン 改版
		/<td class="label"[^<>]*>([^<>]+)<\/td><td[^<>]*>(.+?)<\/td>/g;

		while (matched = PATTERN.exec(html)) {
			work_data[matched[1]] = get_label(matched[2]);
		}

		work_data = Object.assign({
			// 必要屬性：須配合網站平台更改。
			title : work_data.タイトル,

			// 選擇性屬性：須配合網站平台更改。
			// e.g., 連載(連載中) 2話, 連載(完結)
			status : work_data.話数.replace(/連載\(([^()]+)\)/, '$1').split(/\s+/),
			author : work_data.作者,
			last_update : work_data.最新投稿,
			description : work_data.あらすじ,
			site_name : 'ハーメルン'
		}, work_data);

		if (work_data.必須タグ) {
			work_data.status.append(work_data.必須タグ.split(/\s+/));
		}
		if (work_data.タグ) {
			work_data.status.append(work_data.タグ.split(/\s+/));
		}
		if (work_data.警告タグ) {
			work_data.status.append(work_data.警告タグ.split(/\s+/));
		}
		work_data.status = work_data.status.unique();

		return work_data;
	},
	// 對於章節列表與作品資訊分列不同頁面(URL)的情況，應該另外指定.chapter_list_URL。
	chapter_list_URL : function(work_id) {
		return 'novel/' + work_id + '/';
	},
	get_chapter_list : function(work_data, html, get_label) {
		// console.log(html);

		if (!html.includes('<table width=100%>')
		// 對於單話，可能無目次。
		// e.g., https://novel.syosetu.org/106514/
		&& html.includes(this.check_chapter_NO[0])) {
			work_data.chapter_list = [ {
				url : '' /* '1.html' */,
				title : get_label(html.between('<span style="font-size:120%">',
						'</span>'))
			} ];
			return;
		}

		work_data.chapter_list = [];
		var part_title;
		html.between('<table width=100%>', '</div>')
		/**
		 * <code>
		<tr bgcolor="#FFFFFF" class="bgcolor3"><td width=60%><span id="7">　</span> <a href=./7.html style="text-decoration:none;">第１話 始まり</a></td><td><NOBR>2017年04月15日(土) 17:45<span title="2018年12月28日(金) 11:17改稿">(<u>改</u>)</span></NOBR></td></tr>
		</code>
		 */
		.each_between('<tr', '</tr>', function(text) {
			if (text.includes('<td colspan=2><strong>')) {
				part_title = text.between('<strong>', '</strong>');
				return;
			}

			// [ , href, inner ]
			var matched = text.match(/ href=([^ "<>]+)[^<>]*>(.+?)<\/a>/);
			if (!matched) {
				throw text;
			}

			var chapter_data = {
				part_title : part_title,
				url : matched[1].replace(/^\.\//, ''),
				date : [ text.match(/>\s*(2\d{3}[年\/][^"<>]+?)</)[1].to_Date({
					zone : work_data.time_zone
				}) ],
				title : matched[2]
			};
			if (matched = text.match(/ title="(2\d{3}[年\/][^"<>]+?)改稿"/)) {
				chapter_data.date.push(matched[1].to_Date({
					zone : work_data.time_zone
				}) || matched[1]);
			}
			work_data.chapter_list.push(chapter_data);
			// console.log(chapter_data);
		});
	},

	// 取得每一個章節的各個影像內容資料。 get_chapter_data()
	chapter_URL : function(work_data, chapter_NO) {
		return this.chapter_list_URL(work_data.id)
				+ work_data.chapter_list[chapter_NO - 1].url;
	},
	// 檢測所取得內容的章節編號是否相符。
	check_chapter_NO : [ '<div style="text-align:right;font-size:80%">', '/' ],
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// 儲存單一檔案之全篇文字。
		if (!this.got_all) {
			this.got_all = Object.create(null);
		}
		if (!this.got_all[work_data.id]) {
			// 避免多章節時重複get。
			// 不儲存在work_data，因為work_data會有cache，下次執行依然會保持舊的設定。
			this.got_all[work_data.id] = work_data.title;
			CeL.create_directory(this.main_directory
					+ this.cache_directory_name);
			CeL.get_URL(this.base_URL
			// 放在這，是為了確保章節有變化時才重新取得。
			+ '?mode=ss_view_all&nid=' + work_data.id,
			// save full text 一括表示
			null, null, null, {
				write_to : this.main_directory + this.cache_directory_name
						+ work_data.directory_name + '.full_text.htm'
			});
		}

		var text = html
		//
		.between('<div class="ss">', '<span id="analytics_end">')
		// remove </div>
		.between(null, {
			tail : '</div>'
		})
		// remove chapter title
		.replace(/<p><span style="font-size:120%">.+?<\/p>/, '')
		// remove chapter count (e.g., 1 / 1)
		.replace(
		//
		/<div style="text-align:right;font-size:80%">[\d\s\/]+?<\/div>/, '')
		// e.g., id="text" → id="text"
		.replace(/ (id)=([a-z]+)/g, ' $1="$2"')
		// remove chapter title @ contents
		.replace(
				/[\s\n]+<span style="font-size:120%">(?:.+?)<\/span><BR><BR>/g,
				'');

		var chapter_data = work_data.chapter_list[chapter_NO - 1];

		this.add_ebook_chapter(work_data, chapter_NO, {
			title : chapter_data.part_title,
			sub_title : chapter_data.title,
			text : text
		});
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// for 年齢確認: あなたは18歳以上ですか？
crawler.setup_value('cookie', 'over18=off');
start_crawler(crawler, typeof module === 'object' && module);
