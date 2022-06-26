/**
 * 批量下載 ニコニコ静画 的工具。 Download niconico seiga comics.
 * 
 * @see ComicWalker.js
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 日本的網路漫畫網站習慣刪掉舊章節，因此每一次都必須從頭檢查。
	recheck : true,

	// one_by_one : true,
	base_URL : 'https://seiga.nicovideo.jp/',

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return 'search/' + encodeURIComponent(work_title) + '?target=manga';
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		html = html.between('<div id="comic_list"', '</ul>');

		var id_list = [], id_data = [];
		html.each_between('<li class="mg_item item"', '</li>', function(text) {
			var title = text.between('<div class="title"', '</div>').between(
					'>');
			var url = title.match(/ href="\/comic\/(\d+)/);
			title = get_label(title);
			id_list.push(+url[1]);
			id_data.push(title);
		});

		// console.log([ id_list, id_data ]);
		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : 'comic/',
	// ComicWalker 2018/10/16? 更新
	parse_work_data : function(html, get_label, extract_work_data) {
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<div class="main_title"', '</div>')
					.between('<h1', '</h1>').between('>')),

			// 選擇性屬性：須配合網站平台更改。

			official : get_label(html.between('<div class="official_title">',
					'</div>')),

			authors : get_label(html.between(
			// <div class="acItem-copy">
			// <a href="/contents/author/2442/">濃口kiki(漫画)</a><a
			// href="/contents/author/2566/">犬魔人(原作)</a><a
			// href="/contents/author/2567/">こちも(キャラクター原案)</a> <div
			// class="acItem-copy-inner"><span>©Koikuchi Kiki ©Inumajin
			// ©Kochimo</span></div>
			'<div class="author">', '</div>')),

			/**
			 * https://seiga.nicovideo.jp/comic/28215?track=gw2020 <code>
			<div class="regulations comic"><div class="notice"><span class="icon_attentions"></span><span class="message">この作品には次の表現が含まれます</span></div><div class="regulation"><div class="block adult"><span class="icon_adult"></span><span>性的な描写</span></div><div class="block gro"><span class="icon_gro"></span><span>過激な暴力描写</span></div></div></div>
			</code>
			 */
			notice : get_label(html.between('<div class="notice">', '</div>')),

			image : html.between('<div class="main_visual">', '</div>')
					.between('<img src="', '"'),

			last_update : get_label(
			// <div class="meta_info">
			// 2020年02月03日開始
			// 2020年04月06日更新
			// <span style="padding-left: 16px">
			// [
			// 4話連載中 ]
			// </span>
			html.between('<div class="meta_info">', '</span>')).replace(
					/[\n\s]{2,}/g, ' '),
			// <div class="tip content_status status_series">
			// <img src="/img/_.gif" class="icon" width="1">
			// <span>連載</span>
			// <img src="/img/_.gif" class="icon" width="1">
			// </div>
			status : get_label(html.between('content_status ', '</div>')
					.between('>')),
			description : get_label(html.between(
					'<div class="description_text">', '</div>'))
		};

		// <dl class="count_info clearfix">
		html.between('<dl class="count_info', '</dl>').each_between(
		// <dt class="count_info__label count_info__label--view">再生(累計)</dt>
		// <dd class="count_info__item count_info__item--add-border">594243</dd>
		'<dt', '</dd>', function(text) {
			var title = get_label(text.between('>', '</dt>'));
			var value = get_label(text.between('<dd').between('>'))
			//
			.replace(/[\n\s]{2,}/g, ' ');
			work_data[title] = value;
		});

		extract_work_data(work_data, html);

		// 因為沒有明確記載作品是否完結，一年沒更新就不再檢查。
		work_data.recheck_days = 400;

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		// console.log(html);
		// <div id="episode_list" class=" inner tile_view ">
		// <ul style="list-style:none">
		html = html.between('<div id="episode_list"', '</ul>');
		// console.log(html);
		work_data.chapter_list = [];
		// <li class="episode_item">
		html.each_between('<li', '</li>', function(text) {
			// <span class="mg_status status">23 ページ</span></a></div><div
			// class="description"><div class="title"><a
			// href="/watch/mg453363?track=ct_episode">第1話</a></div>
			var status = text.between('<span class="mg_status status">',
					'</span>');
			var matched = text.between('<div class="title">', '</div>').match(
					/<a href="([^<>"]+)"[^<>]*?>([^<>]+)</);
			work_data.chapter_list.push({
				// matched[1].replace(work_data.title, '')
				title : get_label(matched[2])
						+ (status ? ' (' + status + ')' : ''),
				url : matched[1]
			});
		});
		// work_data.chapter_list.reverse();

		// 因為中間的章節可能已經被下架，因此依章節標題來定章節編號。
		this.set_chapter_NO_via_title(work_data);
		// console.log(work_data);
	},

	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// console.log(html);
		var text = html.between('var args =', ';\n');
		// text = html.between(' id="page_contents"', '</ul>');

		// console.trace(text || html);
		var chapter_data = work_data.chapter_list[chapter_NO - 1];
		try {
			text = JSON.parse(text);
		} catch (e) {
			text = html.between('<div class="error__title">', '</div>');
			if (text) {
				CeL.error({
					T : [ '《%1》：%2', chapter_data.title, text.trim() ]
				});
				chapter_data.limited = true;
				return chapter_data;
			}
		}

		chapter_data.image_list = text.pages;
		delete text.pages;
		Object.assign(chapter_data, text);

		// console.log(chapter_data);
		return chapter_data;
	},

	image_preprocessor : function(contents, image_data) {
		if (!contents)
			return;
		// console.log(image_data);

		// @see this.getFromCORSRequest , this.decrypt @
		// https://seiga.nicovideo.jp/js/manga/common.min.js?c11yvi:formatted
		// e.g.,
		// "https://drm.nicoseiga.jp/image/a19b6aff928acdc627d3898808b9347e36dd6246_18377/10056744p"
		// image_data.url.match(/image\/([a-f\d]{40})_\d+\//);
		var decode_key = image_data.url.match(/image\/([\da-f]{16})/);
		if (!decode_key) {
			// e.g., https://seiga.nicovideo.jp/watch/mg181753?track=ct_episode
			return;
		}
		decode_key = decode_key[1];

		// decode image 用的關鍵 key
		decode_key = decode_key.match(/[\da-f]{2}/gi).map(function(t) {
			return parseInt(t, 16);
		});
		for (var index = 0, length = contents.length; index < length; index++) {
			// 8 === decode_key.length
			contents[index] ^= decode_key[index % 8];
		}
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

setup_crawler(crawler, typeof module === 'object' && module);

if (crawler.password && crawler.mail_tel || crawler.site_configuration.cookie) {
	if (crawler.account) {
		CeL.log([ crawler.id + ': ', {
			// gettext_config:{"id":"login-as-$1"}
			T : [ 'Login as [%1]', crawler.mail_tel ]
		} ]);
	}

	if (crawler.site_configuration.cookie) {
		start_crawler(crawler, typeof module === 'object' && module);
		return;
	}
	crawler.get_URL('https://account.nicovideo.jp/login/redirector'
			+ '?show_button_twitter=1&site=seiga&show_button_facebook=1'
			+ '&next_url=%2Fmanga%2F%3Ftrack%3Dhome', function(XMLHttp) {
		// console.log(XMLHttp);
		start_crawler(crawler, typeof module === 'object' && module);
	}, {
		mail_tel : crawler.mail_tel,
		password : crawler.password
	});
} else {
	// https://qa.nicovideo.jp/faq/show/2756?site_domain=default
	CeL.error('ニコニコ静画を利用する為にはniconicoのアカウントが必要です。');
	// 2022/6/26 12:3:47
	CeL.error('ニコニコ採兩步驗證，必須改採 cookie 的方法。');
	CeL.info('work_crawler.configuration.js でアカウントを設置してください。');
}
