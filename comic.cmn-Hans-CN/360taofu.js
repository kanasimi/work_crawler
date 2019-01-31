/**
 * 批量下載 360漫画 的工具。 Download 360taofu, http://www.xatxwh.com/ comics.
 * 
 * 晴天漫画程序 skin1 2011.06.24更新; 腾讯动漫模板?
 * 
 * modify from nokiacn.js
 * 
 * @see qTcms 晴天漫画程序 晴天漫画系统 http://manhua2.qingtiancms.net/
 */

'use strict';

require('../work_crawler_loder.js');

// ----------------------------------------------------------------------------

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
function encodeURIComponent_lower_case(string) {
	return string.replace(/[^a-zA-Z\d().!~*'\-_]/g, function(c) {
		return encodeURIComponent(c).toLowerCase();
	});
}

var crawler = new CeL.work_crawler({
	// 所有的子檔案要修訂註解說明時，應該都要順便更改在CeL.application.net.comic中Comic_site.prototype內的母comments，並以其為主體。

	// 本站採用採集其他網站圖片的方法，錯漏圖片太多。
	skip_error : true,

	guess_image_url : true,

	// {Natural}最小容許圖案檔案大小 (bytes)。
	// MIN_LENGTH : 500,

	// one_by_one : true,

	// old: http://www.360taofu.com/ 360桃符??
	base_URL : 'http://www.xatxwh.com/',
	// fs.readdirSync('.').forEach(function(d){if(/^\d+\s/.test(d))fs.renameSync(d,'manhua-'+d);})
	// fs.readdirSync('.').forEach(function(d){if(/^manhua-/.test(d))fs.renameSync(d,d.replace(/^manhua-/,''));})
	// 所有作品都使用這種作品類別前綴。
	// use_work_id_prefix : 'manhua',

	// 規範 work id 的正規模式；提取出引數中的作品id 以回傳。
	extract_work_id : function(work_information) {
		if (/^[a-z\-\d]+_[a-z\-\d]+$/.test(work_information))
			return work_information;
	},

	// 解析 作品名稱 → 作品id get_work()
	search_URL : function(work_title) {
		return [ 'statics/qingtiancms.ashx', {
			cb : 'jQuery'
			// @see .expando
			+ ('1.7.2' + Math.random()).replace(/\D/g, "") + '_' + Date.now(),
			key : work_title,
			action : 'GetSear1',
			_ : Date.now()
		} ];
	},
	parse_search_result : function(html, get_label) {
		// console.log(html);
		html = eval(html.between('(', {
			tail : ')'
		}));
		// console.log(html);
		return [ html, html ];
	},
	id_of_search_result : function(data) {
		// .u: webdir + classid1pinyin + titlepinyin + "/"
		// webdir: "/"
		// classid1pinyin: latin + "/"
		// titlepinyin: latin
		var matched = data.u.match(/([^\/]+\/[^\/]+)\/$/);
		return matched && matched[1].replace(/\//, '_');
	},
	title_of_search_result : 't',

	// 取得作品的章節資料。 get_work_data()
	work_URL : function(work_id) {
		return work_id.replace(/_/, '\/') + '/';
	},
	parse_work_data : function(html, get_label, extract_work_data) {
		// console.log(html);
		var work_data;
		eval('work_data=' + html.between('qingtiancms_Details=', ';var'));

		extract_work_data(work_data, html.between(
		// <div class="cy_zhangjie">...<div class="cy_zhangjie_top">
		'<div class="cy_zhangjie_top">',
		// <div class="cy_plist" id="play_0">
		' class="cy_plist"'), /<p>([^<>：]+)：([\s\S]*?)<\/p>/g);

		html = html.between(
		// <div class="mh-date-info fl"> <div class="mh-date-info-name">
		'<div class="mh-date-info', '<div class="work-author">');
		extract_work_data(work_data, html,
				/<span[^<>]*>([^<>：]+)：([\s\S]*?)<\/span>/g);

		Object.assign(work_data, {
			qTid : work_data.id,
			author : work_data.作者,
			status : work_data.状态,
			评分 : get_label(html.between(' id="comicStarDis">', '<')),
			latest_chapter : work_data.最新话,
			last_update : work_data.更新时间,
			description : get_label(html.between(
			// <div id="workint" class="work-ov">
			' id="workint"', '</div>').between('>'))
		});

		// console.log(work_data);
		return work_data;
	},
	get_chapter_list : function(work_data, html, get_label) {
		html = html.between('<div class="cy_plist', '</div>');

		var matched, PATTERN_chapter =
		//
		/<li><a href="([^<>"]+)"[^<>]*>([\s\S]+?)<\/li>/g;

		work_data.chapter_list = [];
		while (matched = PATTERN_chapter.exec(html)) {
			var chapter_data = {
				url : matched[1],
				title : get_label(matched[2])
			};
			work_data.chapter_list.push(chapter_data);
		}
		work_data.chapter_list.reverse();
		// console.log(work_data.chapter_list);
	},

	parse_chapter_data : function(html, work_data) {
		// modify from mh160.js

		var chapter_data = html.between('qTcms_S_m_murl_e="', '"');
		if (chapter_data) {
			// 對於非utf-8編碼之中文，不能使用 atob()???
			chapter_data = atob(chapter_data).split("$qingtiandy$");
		}
		if (!chapter_data) {
			CeL.log('無法解析資料！');
			return;
		}
		// console.log(JSON.stringify(chapter_data));
		// console.log(chapter_data.length);
		// CeL.set_debug(6);

		// 設定必要的屬性。
		chapter_data = {
			image_list : chapter_data.map(function(url) {
				// 获取当前图片 function f_qTcms_Pic_curUrl_realpic(v)
				// http://www.xatxwh.com/template/skin1/css/d7s/js/show.20170501.js?20190117082944
				if (url.startsWith('/')) {
					// url = qTcms_m_weburl + url;
				} else if (html.between('qTcms_Pic_m_if="', '"') !== "2") {
					if (this.guess_image_url && this.had_called_api) {
						var original_url;
						if (false) {
							url = url.replace(/^.+:\/(\/[^\/]+\/comic\/)/,
							// http://www.xatxwh.com/hougong/nvzixueyuandenansheng/306555.html
							// http://www.xatxwh.com/hougong/nvzixueyuandenansheng/306615.html
							// http://www.xatxwh.com/hougong/nvzixueyuandenansheng/306617.html
							function(all, domain) {
								if (domain === '/mhpic.cnmanhua.com/comic/') {
									// http://mhpic.cnmanhua.com/comic/N%2F%E5%A5%B3%E5%AD%90%E5%AD%A6%E9%99%A2%E7%9A%84%E7%94%B7%E7%94%9F%2F60%E8%AF%9D%2F1.jpg-kmw.middle
									// sometimes '2f', sometimes 'f'
									return encodeURIComponent_lower_case('/')
											.slice(1);
								}
								return all;
							});
						}
						url = url.replace(/^.+:\/(\/[^\/]+\/)/,
						// 去掉 domain。
						function(all, domain) {
							// http://www.xatxwh.com/maoxian/shenzhouluan/43845.html
							if (domain in {
								'/ac.tc.qq.com/' : true,
								'/res.img.pufei.net/' : true,
								'/res.gufengmh.com/' : true,
								'/res.mhkan.com/' : true,
								// http://img.manhua.weibo.com/comic/15/69915/325331/001_325331_shard_0.jpg
								'/img.manhua.weibo.com/' : true,
								'/www.72qier.com/' : true,
								// http://www.xatxwh.com/wuxia/longfuzhiwangdaotianxia/85948.html
								'/coldpic.sfacg.com/' : true,
								'/mhpic.isamanhua.com/' : true

							// http://www.xatxwh.com/xuanhuan/mikexingdong/473867.html
							// http://www.uc5522.net/upload2/5305/2018/12-26/20181226142148_978226bk48kPjA.D._small.jpg
							}) {
								return '';
							}

							// http://www.xatxwh.com/maoxian/shenzhouluan/43899.html
							if (domain in {
								'/manhua.qpic.cn/' : true
							}) {
								return domain;
							}

							original_url = url;
						});
						url = encodeURIComponent_lower_case(
						// 尋找採集後放置的地點。
						url.replace(/[\s.]/g, '_')).replace(/%/g, '_');
						url = '/qingtiancms_wap/upload2/cache/'
								+ work_data.qTid + '/' + url + '.jpg';
						if (!original_url) {
							return {
								url : url
							};
						}

						if (!original_url.includes('/mhpic.cnmanhua.com/'))
							CeL.error('Unknown domain: "' + original_url
									+ '", 請回報。');
						url = original_url;
					}

					// 每個IP最起碼必須先呼叫過一次API?
					this.had_called_api = true;

					// 因被 Cloudflare 保護，盡可能改成上面使用的，嘗試直接取得圖片檔案位址。
					// 其他判別不出來的，則用正統方法。
					url = url.replace(/\?/gi, "a1a1").replace(/&/gi, "b1b1")
							.replace(/%/gi, "c1c1");
					url = (html.between('qTcms_m_indexurl="', '"') || '/')
							+ "statics/pic/?p="
							+ escape(url)
							+ "&picid="
							+ html.between('qTcms_S_m_id="', '"')
							+ "&m_httpurl="
							+ escape(atob(html.between('qTcms_S_m_mhttpurl="',
									'"')));
					// Should get Status Code: 302 Found
				}
				return {
					url : url
				};
			}, this)
		};
		// console.log(JSON.stringify(chapter_data));

		return chapter_data;
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
