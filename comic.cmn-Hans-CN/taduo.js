/**
 * 批量下載 塔多漫画网 的工具。 Download taduo comics.
 */

'use strict';

require('../work_crawler_loader.js');

// ----------------------------------------------------------------------------

CeL.run('application.net.work_crawler.sites.qTcms2014');

// ----------------------------------------------------------------------------

var crawler = CeL.qTcms2014({
	base_URL : 'http://www.taduo.net/',

	/**
	 * 處理特殊圖片: 遇到下架章節時圖片會顯示 http://mh.lianzhixiu.com/2018/03/14/pb.jpg
	 * 
	 * <code>
	  <div id="section">
	  <div class="wp">  <div class="mh_tsw2"><div class="mh_ts2" style="color:#f40;font-size: 15px;">  <b>蓝翅漫画</b>中因为版权或其他问题，我们将对所有章节进行屏蔽！</div>    </div></div>
	  </div>
	</code>
	 */
	is_limited_image_url : function(image_data) {
		// 這時 chapter_data.image_count 似乎全部都是 3
		return image_data.url && image_data.url.endsWith('2018/03/14/pb.jpg');
	}
});

// ----------------------------------------------------------------------------

// CeL.set_debug(3);

start_crawler(crawler, typeof module === 'object' && module);
