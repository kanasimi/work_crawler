/**
 * 批量下載 亲亲漫画网 的工具。 Download 930mh.com → duzhez.com comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.SinMH');

// ----------------------------------------------------------------------------

var crawler = CeL.SinMH({
	// one_by_one : true,

	// 2020/4/24 單一作品 1s: NG, 1200ms: OK
	chapter_time_interval : 6000,

	// 圖像檔案下載失敗處理方式：忽略/跳過圖像錯誤。當404圖像不存在、檔案過小，或是被偵測出非圖像(如不具有EOI)時，依舊強制儲存檔案。default:false
	skip_error : true,

	// old: http://www.duzhez.com/
	// 2019/8 改網址: http://www.93gmh.com/
	// 2019/10/17 改網址: http://www.rubobo.com/
	// 2021/2/25 改網址: https://www.acgcd.com/
	base_URL : 'https://www.acgcd.com/',

	extract_work_id : function(work_information) {
		return CeL.is_digits(work_information) && work_information;
	},

	// for 年轻人脱离黑魔法虽然刻不容缓、但试着就业之后待遇却很好、社长和使魔也非常可爱真是棒极了！
	acceptable_types : 'images',

	search_URL : 'API',
	api_base_URL : 'https://api.acg.gd/',

	/**
	 * @see function cops201921() @ http://www.duzhez.com/js/cops201921.js<br /> →
	 * 2019/5/1 亲亲漫画改版: function kda20190501() @ http://www.duzhez.com/js/kda20190501.js
	 */
	crypto_duzhez : {
		key : "9Xc4PMs2cvQinnbd",
		iv : "ioXA45KJnv98ccSB"
	},
	/**
	 * 2019/8 改網址: function pt20190804() @ http://www.93gmh.com/js/pt20190804.js
	 */
	crypto : {
		key : "u1S2Bvvwp1XZ37B9",
		iv : "2VNNjmjywpbnsYmW"
	},
	/**
	 * 2019/10/17 改網址: function jmzz20191018() @ http://www.rubobo.com/js/jmzz20191018.js
	 */
	crypto : {
		iv : "opb4x7z21vg1f3gI",
		key : "cxNB23W8xzKJV26O",
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
