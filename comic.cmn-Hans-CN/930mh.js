/**
 * 批量下載 亲亲漫画网 的工具。 Download 930mh.com → duzhez.com comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.SinMH');

// ----------------------------------------------------------------------------

var crawler = CeL.SinMH({
	// one_by_one : true,

	base_URL : 'http://www.duzhez.com/',

	extract_work_id : function(work_information) {
		return CeL.is_digits(work_information) && work_information;
	},

	// for 年轻人脱离黑魔法虽然刻不容缓、但试着就业之后待遇却很好、社长和使魔也非常可爱真是棒极了！
	acceptable_types : 'images',

	search_URL : 'API',
	api_base_URL : 'https://api.acg.gd/',

	crypto : {
		key : "9Xc4PMs2cvQinnbd",
		iv : "ioXA45KJnv98ccSB"
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
