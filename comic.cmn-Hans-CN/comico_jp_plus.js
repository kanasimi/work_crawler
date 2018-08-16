/**
 * 批量下載 comico（コミコ） オトナ限定 的工具。 Download comico adult comics. (comic.ja-JP)
 * 
 * modify from comico.js
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

function add_navigation_data(data, html) {
	var navigation_data;
	try {
		// コミコ 日文版有時 json 結構有問題。
		// e.g., http://www.comico.jp/articleList.nhn?titleNo=3410
		navigation_data = JSON.parse(html.between(
				'<script type="application/ld+json">', '</script>').replace(
		// e.g., http://www.comico.com.tw/2870/17/
		/\t+"/g, '"'));
	} catch (e) {
		// TODO: handle exception
	}
	return Object.assign(data, navigation_data);
}

var PATTERN_info = /<(p|div) class="[^<>"]+?__(author|(?:sub-)?description|meta)">([\s\S]+?)<\/\1>/g,
// assert: (NO_ticket_notified>=0) === false
NO_ticket_notified = '已無閱讀卷可用', auto_use_ticket_notified,
//
crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// e.g., 20099 俺のメンタルは限界です\0003 3話 「マンガを描く原点」\20099-3-022.jpg
	MIN_LENGTH : 180,

	// one_by_one : true,
	base_URL : 'http://plus.comico.jp/',

	convert_id : {
		// 警告: 需要自行呼叫 insert_id_list(id_list);
		adult : function(insert_id_list, get_label) {
			// 此前被當作是一般作品。
			CeL.info(this.id + ': 此後的作品標題都被當作是網頁限定作品。');
			// webonly, オトナ限定: TW only
			this.adult = true;
			insert_id_list();
		}
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		var url = (this.adult ? 'webonly/' : '')
		// ↑ webonly, オトナ限定: TW only
		+ 'search/index.nhn?searchWord='
				+ encodeURIComponent(work_title.replace(/\s+\d+$/, ''));
		if (this.base_URL.includes('\/\/plus.comico')) {
			url = this.base_URL.replace('\/\/plus.comico', '\/\/www.comico')
					+ url;
		}
		return url;
	},
	search_head_token : ' data-result-type="manga">',
	// title 不能用 [^<>"]+ : for case of "薔薇的嘆息 <薔薇色的疑雲 I>"
	PATTERN_search : /<a href="[^<>"]*?titleNo=(\d+)"[\s\S]*? alt="([^"]+)"/,
	parse_search_result : function(html, get_label) {
		html = html.between(' id="officialList">') || html;
		var _this = this, id_list = [], id_data = [];
		html.each_between(this.search_head_token, '</li>', function(token) {
			// console.log(token);
			var matched = token.match(_this.PATTERN_search);
			if (matched) {
				// コミコ有些整本賣的作品，而非一話一話。
				id_list.push(matched[1]);
				id_data.push(get_label(matched[2]));
			}
		});

		return [ id_list, id_data ];
	},

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return 'manga/' + work_id + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.log(html);
		var work_data = {
			// 必要屬性：須配合網站平台更改。
			title : get_label(html.between('<h1', '</h1>').between('>'))
		// 選擇性屬性：須配合網站平台更改。
		}, cmnData = html.between('var cmnData =', '</script>'), matched;

		eval('cmnData=' + cmnData);

		extract_work_data(work_data, html);

		while (matched = PATTERN_info.exec(html)) {
			if (matched[3] = get_label(matched[3]).replace(/\t/g, ''))
				work_data[matched[2]] = matched[3];
		}

		Object.assign(add_navigation_data(work_data, html),
		// 警告: 這會留下個人資訊！
		cmnData, {
			// 更新日期：每週連載時間/是否為完結作品。 e.g., 完結作品, 每週六, 隔週週日
			status : get_label(html.between('__info-value">', '</dd>')
			// コミコ e.g., 完結作品, 毎週金曜日
			|| html.between('<span class="o-txt-bold">', '</span>')).replace(
					/[\s\n]{2,}/g, '  '),
			// 可用的閱讀券數量。
			ticket_left : (cmnData.eventRentalTicket || 0)
			// 若是不用等的話，表示已收到閱讀券，還有一張可用。
			+ (cmnData.time.leftTime === 0 ? 1 : 0),
			last_checked : null
		});
		if (cmnData.time.leftTime > 0) {
			CeL.info('下次收到閱讀券還要 '
			// レンタル券で無料 レンタル券が届きました（1日で回復）
			// 作品を1話レンタルできます
			+ CeL.age_of(0, 1000 * cmnData.time.leftTime));
		}

		return work_data;
	},
	chapter_list_URL : function(work_id, work_data) {
		return [ 'api/getArticleList.nhn', {
			titleNo : work_id
		} ];
	},
	get_chapter_list : function(work_data, html, get_label) {
		// console.log(html);
		html = JSON.parse(html).result;
		html.list.forEach(function(chapter_data) {
			chapter_data.url = chapter_data.articleDetailUrl;
			chapter_data.subtitle = get_label(chapter_data.subtitle);
		});
		work_data.chapter_list = html.list;
		// 預防尾大不掉。
		delete html.list;
		Object.assign(work_data, html);

		// 先檢查是不是還有還有沒讀過的章節。
		if (work_data.ticket_left > 0) {
			if (work_data.last_download) {
				work_data.chapter_list.some(function(chapter_data, index) {
					if (++index >= work_data.last_download.chapter) {
						return true;
					}
					if (!chapter_data.read) {
						CeL.info(work_data.title + ': 還有'
								+ work_data.ticket_left + '張閱讀卷，且第 ' + index
								+ '/' + work_data.chapter_list.length
								+ ' 章還有沒讀過，從此章開始檢查。');
						work_data.last_checked
						// 記錄最後檢查過的章節。
						= work_data.last_download.chapter;
						work_data.last_download.chapter = index;
						return true;
					}
				});
			} else {
				work_data.recheck = true;
			}
		}
	},

	consume_url : 'manga/consume/index.nhn',
	pre_parse_chapter_data
	// 執行在解析章節資料process_chapter_data()之前的作業(async)。
	: function(XMLHttp, work_data, callback, chapter_NO) {
		// console.log(work_data);
		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		chapter_title = chapter_data.subtitle,
		//
		skip_chapter = !chapter_data.price
		//
		|| chapter_data.isPurchased && ('已付費購買 ' + chapter_title)
		//
		|| chapter_data.expireDate > 0 && ('在 '
		//
		+ new Date(chapter_data.expireDate).format('%m/%d %H:%M')
		//
		+ ' 之前(還有 ' + CeL.age_of(Date.now(), chapter_data.expireDate)
		//
		+ ')可以閱讀本章: ' + chapter_title);
		// console.log(chapter_data);
		if (!skip_chapter && chapter_data.read) {
			skip_chapter = '之前已閱讀過 ' + chapter_title + '，不再重新購買。';
			// TODO: 應該檢查是不是真的有圖片檔案存在。
		}
		if (!skip_chapter && chapter_data.freeFlg !== 'W') {
			// N: TW: 本章節需要錢(coin)來閱讀。
			// P: JP: 本章節需要錢(30コイン) or point(15ポイント)來閱讀。
			if (chapter_data.freeFlg === 'N' || chapter_data.freeFlg === 'P') {
				skip_chapter = true;
			} else {
				skip_chapter = '本章節狀況不明(' + chapter_data.freeFlg + ')。跳過 '
						+ chapter_title + '，不採用閱讀卷。';
			}
		}
		if (!skip_chapter && !(work_data.ticket_left > 0)) {
			if (work_data.ticket_left !== NO_ticket_notified) {
				work_data.ticket_left = NO_ticket_notified;
				skip_chapter = NO_ticket_notified + '。跳過 '
				//
				+ chapter_title + '，不使用閱讀券。';
			} else
				skip_chapter = true;
		}
		if (!skip_chapter && !this.auto_use_ticket) {
			skip_chapter = auto_use_ticket_notified ? true : '未設定讓本工具自動使用閱讀卷。'
					+ '若想要讓本工具自動使用閱讀卷，請在 work_crawler_loder.configuration.js'
					+ ' 這個檔案中設定  "auto_use_ticket:true"。'
					+ '您可以參考 work_crawler_loder.js 這個檔案來做設定。';
			auto_use_ticket_notified = true;
		}

		if (skip_chapter) {
			if (skip_chapter !== true)
				CeL.info(work_data.title + ': ' + skip_chapter);
			callback();
			return;
		}

		// http://www.comico.com.tw/notice/detail.nhn?no=751
		CeL.info(work_data.title + ': 用閱讀券閱讀 ' + chapter_title);
		var _this = this, html = XMLHttp.responseText;
		this.get_URL(this.consume_url, function(XMLHttp) {
			if (--work_data.ticket_left === 0 && work_data.last_checked > 0) {
				// 回到原先應該檢查的章節號碼。
				work_data.jump_to_chapter = work_data.last_checked;
				delete work_data.last_checked;
			}
			// XMLHttp 只是一個轉址網頁，必須重新擷取網頁。
			_this.get_URL(chapter_data.url, callback);
		}, {
			titleNo : work_data.id,
			articleNo : chapter_data.articleNo,
			// K: 專用閱讀券, P: 用point, C: 用coin購買
			paymentCode : 'K',
			// 使用coin時才需要
			// https://github.com/zhongfly/comico/blob/master/comico.py
			// ['http://www.comico.com.tw/consume/coin/publish.nhn',{paymentCode:'C'}]
			// JSON.parse(result).result.coinUseToken
			coinUseToken : '',
			// 5, 6, コミコ:36, ...?
			productNo : html.between(' name="productNo" value="', '"') || 5,
			// coin price
			price : chapter_data.price,
			// 用coin租用價格，一般能租用的都可以用閱讀券。 コミコ: 20
			rentalPrice : html.between(' name="rentalPrice" value="', '"')
					|| '',
			// point price, コミコ 漫畫作品無此項, TW only
			pointRentalPrice : html.between(' name="pointRentalPrice" value="',
					'"') || 120
		});
	},
	parse_chapter_data : function(html, work_data, get_label, chapter_NO) {
		// http://static.comico.com.tw/tw/syn/spn/js/manga/article/plusMangaDetailApp/app.1.12.0.js
		var chapter_data = work_data.chapter_list[chapter_NO - 1],
		//
		cmnData = html.between('var cmnData =', '</script>');
		if (cmnData) {
			eval('cmnData=' + cmnData);
		} else if (cmnData = html.between(
		// e.g., http://plus.comico.jp/manga/24517/8/
		'<p class="m-section-error__heading">', '</p>')) {
			cmnData = work_data.title + ' #' + chapter_NO + ' '
					+ chapter_data.subtitle + ': ' + cmnData;
			if (cmnData !== 'お探しのページは存在しません') {
				throw cmnData;
			}
			CeL.error(cmnData);
			return chapter_data;
		}

		var image_url_list = html.between(
		// TW: <div class="locked-episode__kv _lockedEpisodeKv"
		// コミコ: <div class="locked-episode locked-episode--show-kv">
		'<div class="locked-episode', '</div>');
		if (image_url_list) {
			chapter_data.limited = true;
			// TW: style="background-image: url('...');">
			image_url_list = image_url_list.between("url('", "'")
			// コミコ: <img src=".jpg" width="88" height="88" alt="" />
			|| image_url_list.between(' src="', '"');
			// 日文版plus.comico 此時雖然有 {Array}cmnData.imageData
			// 但缺少hash而不能取得。
			if (/\.jpg$/.test(image_url_list)) {
				// 日文版plus.comico 此時僅有一個縮圖可用，跳過不取。
				cmnData.imageData = [];
			} else if (cmnData.imageData
					&& cmnData.imageData.filter(function(url) {
						return url && !/\.jpg$/.test(url);
					}).length > 0) {
				// 應該不會到這裡來了。
				cmnData.imageData.unshift(image_url_list);
			} else {
				// 中文版的狀況。
				cmnData.imageData = [ image_url_list ];
			}

		} else if (image_url_list = html.between(' _comicImage">', '</div>')) {
			// 一般正常可取得圖片的情況。
			// 去除 placeholder。 <div class="comic-image__blank-layer">
			image_url_list = image_url_list.between(null, '<div ')
					|| image_url_list;
			image_url_list = image_url_list.all_between(' src="', '"');
			// assert: {Array}image_url_list
			if (cmnData.imageData) {
				// 中文版, 日文版plus.comico 將除第一張外所有圖片網址放在
				// {Array}cmnData.imageData 裡面。
				if (image_url_list.length === 1) {
					cmnData.imageData.unshift(image_url_list[0]);
				} else {
					throw work_data.title
					// 網頁改版? 不能解析!
					+ ' #' + chapter_NO + ': 網頁改版? 不能解析!';
					Array.prototype.unshift.apply(cmnData.imageData,
							image_url_list);
				}

			} else {
				// コミコ 日文版一般漫畫將所有圖片放在這之間，無 cmnData.imageData。
				cmnData.imageData = image_url_list;
			}

		} else {
			console.log(html);
			throw work_data.title
			// 網頁改版? 不能解析!
			+ ' #' + chapter_NO + ': Can not parse data!';
		}

		Object.assign(add_navigation_data(chapter_data, html), {
			// 設定必要的屬性。
			title : chapter_data.subtitle,
			image_list : cmnData.imageData.map(function(url) {
				if (chapter_data.limited
				// http://comicimg.comico.jp/tmb/00000/1/hexhex_hexhexhex.jpg"
				&& url.includes('.jp/tmb/') && /\.jpg$/.test(url))
					return;
				// 付費章節: 中文版提供第一張的完整版，日文版只提供縮圖。
				// 圖片都應該要有hash，且不該是縮圖。
				if (url.includes('.jp/tmb/') || /\.jpg$/.test(url)) {
					throw work_data.title
					//
					+ ' #' + chapter_NO + ': Invalid image: ' + url;
				}
				return {
					url : url
				};
			})
		}, cmnData);

		return chapter_data;
	},

	after_download : function() {
		// logout
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

// for 年齡確認您是否已滿18歲？
crawler.get_URL_options.cookie = 'islt18age=' + Date.now();

setup_crawler(crawler, typeof module === 'object' && module);
if (crawler.password && crawler.loginid) {
	CeL.log(crawler.id + ': Login as [' + crawler.loginid + ']');
	// https://id.comico.com.tw/login/login.nhn
	// https://id.comico.jp/login/login.nhn
	crawler.get_URL(crawler.base_URL.replace(/^.+?[a-z]+\./, 'https://id.')
			+ 'login/login.nhn', function(XMLHttp) {
		// XMLHttp 只是一個轉址網頁。

		// TODO: 僅僅下載有閱讀券的章節，然後就回到最後讀取的章節。
		// 收件箱: 全部接收 有期限的物品
		// https://id.comico.com.tw/api/incentiveall/index.nhn
		// 最新消息
		// http://www.comico.com.tw/notice/

		start_crawler(crawler, typeof module === 'object' && module);
	}, {
		autoLoginChk : 'Y',
		loginid : crawler.loginid,
		password : crawler.password,
		nexturl : ''
	});

} else {
	start_crawler(crawler, typeof module === 'object' && module);
}
