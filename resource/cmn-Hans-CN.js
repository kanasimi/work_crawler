/*	Localized messages in CeL.
	本檔案為自動生成，請勿手動編輯！
	This file is auto created by auto-generate tool: build(.js) @ 2019.
*/'use strict';if(typeof CeL==='function')CeL.application.locale.gettext.set_text({"CeJS 線上小說漫畫下載工具":"CeJS 线上小说漫画下载工具","欲採用圖形介面請執行 `%1`。":"欲采用图形介面请执行 `%1`。","警告：無法存取作品存放目錄 [%1]！":"警告：无法存取作品存放目录 [%1]！","下載的檔案將放在預設目錄下。":"下载的档案将放在预设目录下。","Usage:":"用法：","option=true":"选项=true","option=value":"选项=数值","作品標題或 id":"作品标题或 id","作品列表檔案":"作品列表档案","Options:":"选项：","boolean":"真伪","number":"数字","string":"字串","function":"函数","無法從網址擷取作品 id：%1":"无法查询到该作品id：%1","Starting %1":"载入 %1","\"%1\" 這個值所允許的數值類型為 %4，但現在被設定成 {%2} %3":"\"%1\" 这个值所允许的数值类型为 %4，但现在被设定为 {%2} %3","有些 \"%1\" 所指定的%2路徑不存在：%3":"有些 \"%1\" 所指定的%2路径不存在：%3","file":"档案","files":"档案","directory":"目录","directories":"目录","fso_file":"档案路径","fso_files":"档案路径","fso_directory":"目录路径","fso_directories":"目录路径","無法處理 \"%1\" 在數值類型為 %2 時之條件！":"无法处理 \"%1\" 在数值类型为 %2 时之条件！","\"%1\" 被設定成了有問題的值：{%2} %3":"\"%1\" 被设定成了有问题的值：{%2} %3","未提供鍵值":"未提供参数","Using proxy server: %1":"使用代理服务器：%1","無法解析的時間":"无法解析的时间","未設定 User-Agent。":"未设定 User-Agent。","Referer 不可為 undefined。":"Referer 不可为 undefined。","設定 Referer：%1":"设定 Referer：%1","最小圖片大小應大於等於零":"最小图像大小应大于等于零","無法解析 %1":"无法解析 %1","無法設定 %1：%2":"无法设定 %1：%2","由命令列":"由命令行","download_options.recheck":"从头检测所有作品之所有章节与所有图片。但不重新下载已完成图片。","download_options.start_chapter":"将开始/接续下载的章节编号。对已下载过的章节，必须配合 .recheck。","download_options.start_list_serial":"指定了要开始下载的列表序号。将会跳过这个讯号之前的作品。一般仅使用于命令列设定。default:1","download_options.rearrange_list_file":"重新整理列表档案。","download_options.regenerate":"章节数量无变化时依旧利用 cache 重建资料(如下载小说时不重新获取网页资料，只重建ebook档)。","download_options.reget_chapter":"重新获取每个所检测的章节内容。","download_options.search_again":"重新搜寻。default:false","download_options.chapter_time_interval":"当网站不允许太过频繁的访问读取/access时，可以设定下载章节资讯/章节内容前的等待时间。例如正常情况可能30秒才看一章节，可设定成 \"30s\"。可配合 one_by_one 选项使用。","download_options.chapter_filter":"筛选想要下载的章节标题关键字。例如\"单行本\"。","download_options.archive_images":"漫画下载完毕后压缩图片档案。","download_options.archive_all_good_images_only":"完全没有出现错误才压缩图片档案。","download_options.remove_images_after_archive":"压缩图片档案之后，删掉原先的图片档案。","download_options.MAX_ERROR_RETRY":"重试次数：下载失败、出错时重新尝试下载的次数。同一档案错误超过此数量则跳出。若值太小，传输到一半坏掉的图片可能被当作正常图片而不会出现错误。","download_options.allow_EOI_error":"当图片不存在 EOI (end of image) 标记，或是被侦测出非图片时，依旧强制储存档案。","download_options.MIN_LENGTH":"最小容许图片档案大小 (bytes)。若值太小，传输到一半坏掉的图片可能被当作正常图片而不会出现错误。","download_options.timeout":"下载网页或图片的逾时等待时间(ms)。若逾时时间太小（如10秒），下载大档案容易失败。","download_options.skip_error":"忽略/跳过图片错误。当404图片不存在、档案过小，或是被侦测出非图片(如不具有EOI)时，依旧强制储存档案。","download_options.skip_chapter_data_error":"当无法获取 chapter 资料时，直接尝试下一章节。","download_options.preserve_work_page":"是否保留作品资料 cache 于 .cache_directory_name 下。","download_options.preserve_chapter_page":"是否保留 chapter page。false: 明确指定不保留，将删除已存在的 chapter page。注意: 若是没有设定 .reget_chapter，则 preserve_chapter_page 不应发生效用。","download_options.remove_ebook_directory":"在包装完电子书之后，把电子书目录整个删掉。请注意：必须先安装 7-Zip **18.01 以上的版本**。","download_options.one_by_one":"循序逐个、一个个下载图片。仅对漫画有用，对小说无用。小说章节皆为逐个下载。","download_options.overwrite_old_file":"当新获取的档案比较大时，覆写旧的档案。","download_options.main_directory":"下载网站的档案后，将储存于此目录下。图片档+纪录档下载位置。","download_options.user_agent":"浏览器识别。运行前后始终维持相同的浏览器识别，应该就不会影响到下载。","download_options.proxy":"代理伺服器 proxy_server: \"proxy=username:password@hostname:port\"","download_options.write_chapter_metadata":"将每个章节压缩档的资讯写入同名(添加.json延伸档名)的JSON档，方便其他工具汇入用。","download_options.write_image_metadata":"将每张图片的资讯写入同名(添加.json延伸档名)的JSON档，方便其他工具汇入用。","download_options.save_preference":"储存偏好选项。","download_options.data_directory":"预设主要下载目录。将会在这个目录下创建各网站的子目录（即 main_directory），再将各网站下载的档案放在此子目录下。若全部清空将会重设下载目录。","download_options.preserve_download_work_layer":"下载完成后保留下载进度条。","download_options.play_finished_sound":"任务完成后播放音效。","從[%1]取得 %2 個圖片伺服器：%3":"从[%1]取得 %2 个图片伺服器：%3","無法從[%1]抽取出圖片伺服器列表！":"无法从[%1]抽取出图片伺服器列表！","%1: 沒有輸入 work_id！":"%1: 没有输入 work_id !","Starting %1, save to %2":"开始处理 %1 ， 储存到 %2","Can not create base directory: %1":"无法创建下载基层目录：%1","作品列表區塊注解 \"*/\" 後面的\"%1\"會被忽略":"作品列表区块注释 “ */ \" 后面的 \"%1\" 会被忽略","無法讀取列表檔案：%1":"无法读取列表档案：%1","重新整理列表檔案：%1":"重新整理列表档案：%1","重新整理列表檔案 [%1]，處理了%2個作品。":"重新整理列表档案 [%1]，处理了 %2 个作品。","重新整理列表檔案 [%1]，注解排除了%2個作品。":"重新整理列表档案 [%1]，注释排除了 %2 个作品。","重新整理列表檔案 [%1]，未作改變。":"重新整理列表档案 [%1]，未作改变。","網址無效：%1":"无效的网址：%1","您可能錯把下載工具檔當作了列表檔案：%1":"您可能错把下载工具当作了列表档案：%1","改採用列表檔案：%1":"改采用列表档案：%1","作品 id 無效：%1":"作品 id 无效：%1","MESSAGE_NEED_RE_DOWNLOAD":"神仙打鼓有时错，脚步踏差谁人无。下载出错了，例如服务器暂时断线、档案阙失(404)。请确认排除错误或错误不再持续后，重新执行以接续下载。","Error: %1":"错误发生：%1","警告：正下載以\"%2\"開始、長度 %1 的作品列表中。重複下載作品列表可能造成錯誤！":"警告：正下载以\"%2\"开始、长度 %1 的作品列表中。重复下载作品列表可能造成错误！","Using convert_id[%1]":"使用解析器[%1]","Using convert_id[%1] via url: %2":"使用解析器[%1]，从 %2 解析出作品列表。","Invalid id converter for %1":"解析器无效：%1","Download %1: %2":"下载作品列表 %1: %2","共%1個作品下載完畢。":"共%1个作品下载完毕。","共%1個特殊狀況記錄於[%2]。":"共%1个特殊状况记录于[%2]。","not found":"未找到","limited":"有限制","finished":"已完结","Invalid token pattern: {%1} %2":"无法采用此种分隔作品栏位之样式：{%1} %2","無法儲存作品《%1》之資訊至檔案！":"无法储存作品《%1》之资讯至档案！","創建並使用作品網址 RegExp：%1":"创建并使用作品网址 RegExp：%1","自作品網址提取出 work id：%1":"自作品网址提取出 work id：%1","無法自作品網址提取出 work id！作品資訊：%1":"无法自作品网址提取出 work id！作品资讯：%1","找到%1個作品：%2":"找到%1个作品：%2","crawler.extract_work_id() 不應回傳 true！請修改工具檔程式碼！":"crawler.extract_work_id() 不应回传 true！请修改工具档程式码！","search result file: %1":"搜寻结果快取档案：%1","重新搜尋作品《%1》":"重新搜寻作品《%1》","已緩存作品 id，不再重新搜尋：%1":"已缓存作品 id，不再重新搜寻：%1","本線上作品網站 %1 的模組未提供搜尋功能。":"本线上作品网站 %1 的模组未提供搜寻功能。","請先輸入作品 id，下載過一次後工具會自動記錄作品標題與 id 的轉換。":"请先输入作品 id，下载过一次后工具会自动记录作品标题与 id 的转换。","亦可手動設定，編輯《%1》之 id 於 %2":"亦可手动设定，编辑《%1》之 id 于 %2","沒有《%1》的搜索結果（網站暫時不可用或改版？）":"没有《%1》的搜索结果（网站暂时不可用或改版？）","沒有搜索結果。網站暫時不可用或改版？":"没有搜索结果。网站暂时不可用或改版？","作品網址解析函數 parse_search_result 未回傳結果！":"作品网址解析函数 parse_search_result 未回传结果！","作品網址解析函數 parse_search_result 未回傳正規結果！":"作品网址解析函数 parse_search_result 未回传正规结果！","無法解析搜尋作品《%1》之結果！":"无法解析搜寻作品《%1》之结果！","無法解析搜尋作品之結果！":"无法解析搜寻作品之结果！","搜尋《%1》找到%2個作品：%3":"搜寻《%1》找到%2个作品：%3","未搜尋到與《%1》相符者。":"未搜寻到与《%1》相符者。","找到%2個與《%1》相符者。":"找到%2个与《%1》相符者。","若您輸入的是 work id，請回報議題讓下載工具設定 extract_work_id()，以免將 work id 誤判為 work title。":"若您输入的是 work id，请回报议题让下载工具设定 extract_work_id()，以免将 work id 误判为 work title。","Use title:":"采用标题：","跳過之前已下載或檢查過，已無需再檢查的章節。":"跳过之前已下载或检查过，已无需再检查的章节。","跳過所有章節":"跳过所有章节","僅檢查%1個章節：%2":"仅检查%1个章节：%2","《%1》已 %2 沒有更新，時間過久不再強制重新下載，僅在章節數量有變化時才重新下載。":"《%1》已 %2 没有更新，时间过久不再强制重新下载，仅在章节数量有变化时才重新下载。","下載%1 - 資訊 @ %2":"下载%1 - 资讯 @ %2","無法取得 %1 的作品資訊：%2":"无法取得 %1 的作品资讯：%2","取得空的內容":"取得空的内容","等待 %2 之後再重新取得作品資訊頁面：%1":"等待 %2 之后再重新取得作品资讯页面：%1","重新取得作品資訊頁面：%1":"重新取得作品资讯页面：%1","《%1》（id：%2）非中日文作品標題。":"《%1》（id：%2）非中日文作品标题。","無法取得或未設定作品標題《%1》（id：%2）。":"无法取得或未设定作品标题《%1》（id：%2）。","下載%1 - 目次 @ %2":"下载%1 - 目次 @ %2","刪除已存在的作品資料 cache：%1":"删除已存在的作品资料 cache：%1","新資料→":"新资料→","Can not get chapter list page!":"无法成功取得章节列表页面！","Create work_data.directory: %1":"创建作品目录：%1","last updated date":"作品最后更新日期","last saved date":"最后储存日期","《%2》：執行 %1 時發生嚴重錯誤，異常中斷。":"《%2》：执行 %1 时发生严重错误，异常中断。","自章節資料→":"自章节资料→","輸入 §%1 的網址，僅下載此一章節。":"输入 §%1 的网址，仅下载此一章节。","作品不存在或已被刪除。":"作品不存在或已被删除。","Can not get chapter count! ":"无法取得作品数量！","或許作品已被刪除或屏蔽？":"或许作品已被删除或屏蔽？","或許作品已被刪除或屏蔽，或者網站改版了？":"或许作品已被删除或屏蔽，或者网站改版了？","Romove chapter list page: %1":"删除已存在的章节列表页面：%1","僅下載章節編號：%1":"仅下载章节编号：%1","手動指定了不下載任何章節！":"手动指定了不下载任何章节！","已設定 .recheck 選項，且之前曾下載過本作品，作品目錄有內容。":"已设定 .recheck 选项，且之前曾下载过本作品，作品目录有内容。","既已設定 .recheck 選項，則將 .reget_chapter 選項設定為 %1 將無作用！":"既已设定 .recheck 选项，则将 .reget_chapter 选项设定为 %1 将无作用！","將自動把 .reget_chapter 轉為 true，明確指定 reget_chapter 以重新取得章節內容。":"将自动把 .reget_chapter 转为 true，明确指定 reget_chapter 以重新取得章节内容。","作品變更過，且符合需要更新的條件。":"作品变更过，且符合需要更新的条件。","因章節數量有變化，將重新下載並檢查所有章節內容：":"因章节数量有变化，将重新下载并检查所有章节内容：","章節數量無變化，共 %1 %2；":"章节数量无变化，共 %1 %2；","章節數量變化過小（僅差 %1 %2），因此不重新下載；":"章节数量变化过小（仅差 %1 %2），因此不重新下载；","但已設定下載所有章節內容。":"但已设定下载所有章节内容。","僅利用 cache 重建資料（如小說、電子書），不重新下載所有章節內容。":"仅利用 cache 重建资料（如小说、电子书），不重新下载所有章节内容。","跳過本作品不處理。":"跳过本作品不处理。","之前已下載到較新的第 %2 %3，因指定 start_chapter=%1 而回溯。":"之前已下载到较新的第 %2 %3，因指定 start_chapter=%1 而回溯。","章節數量 %1 比將開始/接續之下載章節編號 %2 還少，或許因為章節有經過重整，或者上次下載時中途增刪過章節。":"章节数量 %1 比将开始/接续之下载章节编号 %2 还少，或许因为章节有经过重整，或者上次下载时中途增删过章节。","將先備份舊內容、移動目錄，而後重新自第 %1 %2下載！":"将先备份旧内容、移动目录，而后重新自第 %1 %2下载！","將從頭檢查、自第 %1 %2重新下載。":"将从头检查、自第 %1 %2重新下载。","將從頭檢查、自第 %1 %2重新生成電子書。":"将从头检查、自第 %1 %2重新生成电子书。","跳過 %1 不處理。":"跳过 %1 不处理。","Unknown":"未知","自 §%1 接續下載。":"自 §%1 接续下载。","準備取消下載作業中，":"准备取消下载作业中，","準備暫停下載作業中，":"准备暂停下载作业中，","將會在下載完本章節後生效。":"将会在下载完本章节后生效。","繼續下載《%1》。":"继续下载《%1》。","預估還需 %1 下載完本作品。":"预估还需 %1 下载完本作品。","取消下載《%1》。":"取消下载《%1》。","暫停下載《%1》。":"暂停下载《%1》。","跳過本章節不下載。":"跳过本章节不下载。","不在 chapter_filter 所篩範圍內。跳過本章節不下載。":"不在 chapter_filter 所筛范围内。跳过本章节不下载。","跳過 %1 不處理：%2":"跳过 %1 不处理：%2","下載第 %1 %2之章節內容前先等待 %3。":"下载第 %1 %2之章节内容前先等待 %3。","《%2》§%3：執行 %1 時發生嚴重錯誤，異常中斷。":"《%2》§%3：执行 %1 时发生严重错误，异常中断。","原已設定 chapter_list.%1=%2，後又設定 chapter_data.%1=%3，兩者相衝突！":"原已设定 chapter_list.%1=%2，后又设定 chapter_data.%1=%3，两者相冲突！","《%1》：轉成由舊至新之順序。":"《%1》：转成由旧至新之顺序。","Invalid NO_in_part: ":"作品分部之序号无效：","本作依章節標題來決定章節編號；":"本作依章节标题来决定章节编号；","建議設置 recheck=multi_parts_changed 選項來避免多次下載時，遇上缺話的情況。":"建议设置 recheck=multi_parts_changed 选项来避免多次下载时，遇上缺话的情况。","《%1》出現章節編號倒置的情況：":"《%1》出现章节编号倒置的情况：","Can not determine chapter NO from %1.":"无法从%1判断章节序号。","title: %1":"章节标题《%1》","chapter: %1":"章节资料：%1"," (Set as %1)":"依序将章节序号设定为 %1。","工具檔設定了 part_title %1，卻似乎未設定應設定的 `work_data.chapter_list.part_NO`? (part_NO: %2)":"工具档设定了 part_title %1，却似乎未设定应设定的 `work_data.chapter_list.part_NO`? (part_NO: %2)","Invalid chapter_data: %1":"章节资料无效：%1","無法取得 §%1 的網址。":"无法取得 §%1 的网址。","Get data of chapter %1":"获取章节资料 %1",", %1":"，%1","先創建章節目錄：%1":"先创建章节目录：%1","解開圖片壓縮檔：%1":"解开图片压缩档：%1","讀取圖片壓縮檔：%1":"读取图片压缩档：%1","刪除章節內容頁面：%1":"删除章节内容页面：%1","%1 [%2] %3 images.":"%1 [%2] 共 %3 张图片。","（本章為需要付費/被鎖住的章節）":"（本章为需要付费/被锁住的章节）","file extension: %1":"延伸档名：%1","%1：已派發完工作，開始並行下載各圖片。":"%1：已派发完工作，开始并行下载各图片。","下載圖 %1":"下载图 %1","下載第%2張圖前先等待%1。":"下载第%2张图前先等待%1。","無法取得第 %1 章的內容。":"无法获取第 %1 章的内容。","跳過 %1 §%2 並接著下載下一章。":"跳过 %1 §%2 并接着下载下一章。","Retry %1":"重试 %1","因 cache file 壞了（例如為空檔案），將重新取得 chapter_URL，設定 .reget_chapter。":"因 cache file 坏了（例如为空档案），将重新取得 chapter_URL，设定 .reget_chapter。","章節編號依序應為 %1，但無法自章節內容取得編號。":"章节编号依序应为 %1，但无法自章节内容取得编号。","章節編號不一致：依序應為 %1，但從內容擷取出 %2。":"章节编号不一致：依序应为 %1，但从内容撷取出 %2。","等待 %2 之後再重新取得章節內容頁面：%1":"等待 %2 之后再重新取得章节内容页面：%1","重新取得章節內容頁面：%1":"重新取得章节内容页面：%1","等待 %2 之後再取得章節內容頁面：%1":"等待 %2 之后再取得章节内容页面：%1","取得章節內容頁面：%1":"取得章节内容页面：%1","解析出空的頁面資訊！":"解析出空的页面资讯！","解析章節頁面時發生錯誤，中斷跳出：%1":"解析章节页面时发生错误，中断跳出：%1","本章為需要付費/被鎖住的章節。":"本章为需要付费/被锁住的章节。","本章節沒有獲取到任何圖片！":"本章节没有获取到任何图片！","所登記的圖形數量%1與有圖形列表長度%2不同！":"所登记的图形数量%1与有图形列表长度%2不同！","剩 %1 張圖...":"剩 %1 张图...","等待尚未下載完成的圖片檔案：":"等待尚未下载完成的图片档案：","%1：%2筆圖片下載錯誤紀錄":"%1：%2笔图片下载错误纪录","從圖片壓縮檔刪除%1張本次下載成功、上次下載失敗的損壞圖片：%2":"从图片压缩档删除%1张本次下载成功、上次下载失败的损坏图片：%2","更新圖片壓縮檔：%1":"更新图片压缩档：%1","創建圖片壓縮檔：%1":"创建图片压缩档：%1","%2: jump to chapter %1":"《%2》：跳到章节编号%1","若欲動態增加章節，必須手動增加章節數量: work_data.chapter_count++！":"若欲动态增加章节，必须手动增加章节数量: work_data.chapter_count++！","（本次下載共處理%1個字）":"（本次下载共处理%1个字）","（本次下載共處理%1張圖）":"（本次下载共处理%1张图）","於 %1 下載完畢。":"于 %1 下载完毕。","有些為付費/受限章節。":"有些为付费/受限章节。","%1：本次下載作業，本作品共%2張圖片下載錯誤。":"%1：本次下载作业，本作品共%2张图片下载错误。","未指定圖片資料":"未指定图片资料","Invalid acceptable_types: %1":"`acceptable_types` 无效：%1","Invalid URL, MUST encode first: %1":"必须先将URL编码：%1","測試圖片是否完整：%1":"测试图片是否完整：%1","無法處理類型為%2之圖片檔：%1":"无法处理类型为%2之图片档：%1","無法判別圖片檔之類型：%1":"无法判别图片档之类型：%1","出錯次數：%1":"出错次数：%1","強制將非圖片檔儲存為圖片":"强制将非图片档储存为图片","強制將空內容儲存為圖片":"强制将空内容储存为图片","強制儲存損壞的圖片":"强制储存损坏的图片"," (status %1)":"（HTTP状态码%1）"," (error: %1)":"（发生错误：%1）"," %1 bytes":"，档案大小 %1 bytes","刪除損壞的舊圖片檔：%1":"删除损坏的旧图片档：%1","壓縮檔內的圖片品質比目錄中的更好：%1":"压缩档内的图片品质比目录中的更好：%1","壓縮檔內的圖片品質比目錄中的更好，但在下載完後將可能在壓縮時被覆蓋：%1":"压缩档内的图片品质比目录中的更好，但在下载完后将可能在压缩时被覆盖：%1","保存圖片數據到硬碟上：%1":"保存图片数据到硬碟上：%1","無法寫入圖片檔案 [%1]。":"无法写入图片档案 [%1]。","這可能肇因於作品資訊 cache 與當前網站上之作品章節結構不同。":"这可能肇因于作品资讯 cache 与当前网站上之作品章节结构不同。","若您之前曾經下載過本作品的話，請封存原有作品目錄，或將作品資訊 cache 檔（作品目錄下的 作品id.json）改名之後嘗試全新下載。":"若您之前曾经下载过本作品的话，请封存原有作品目录，或将作品资讯 cache 档（作品目录下的 作品id.json）改名之后尝试全新下载。","存在較大的舊檔 (%2)，將不覆蓋：%1":"存在较大的旧档 (%2)，将不覆盖：%1","圖檔損壞：":"图档损坏：","無法成功取得圖片。":"无法成功取得图片。","HTTP狀態碼%1，":"HTTP状态码%1，","圖片無內容：":"图片无内容：","檔案過小，僅 %1 bytes：":"档案过小，仅 %1 bytes：","檔案僅 %1 bytes：":"档案仅 %1 bytes：","或許圖片是完整的，只是過小而未達標，例如幾乎為空白之圖片。":"或许图片是完整的，只是过小而未达标，例如几乎为空白之图片。","您可設定 MIN_LENGTH，如 MIN_LENGTH=%1 表示允許最小為 %1 bytes 的圖片；或者先設定 skip_error=true 來忽略圖片錯誤，待取得檔案後，自行更改檔名，去掉錯誤檔名後綴%2以跳過此錯誤。":"您可设定 MIN_LENGTH，如 MIN_LENGTH=%1 表示允许最小为 %1 bytes 的图片；或者先设定 skip_error=true 来忽略图片错误，待取得档案后，自行更改档名，去掉错误档名后缀%2以跳过此错误。","下載所得的圖片大小不同：%1。":"下载所得的图片大小不同：%1。","若非因網站提早截斷連線，那麼您或許需要增長時限來提供足夠的時間下載圖片？":"若非因网站提早截断连线，那么您或许需要增长时限来提供足够的时间下载图片？","若錯誤持續發生，您可以設定 skip_error=true 來忽略圖片錯誤。":"若错误持续发生，您可以设定 skip_error=true 来忽略图片错误。","您必須設定 skip_error 或 allow_EOI_error 選項，才會儲存損壞的檔案。":"您必须设定 skip_error 或 allow_EOI_error 选项，才会储存损坏的档案。","若您需要重新下載之前下載失敗的章節，請開啟 recheck 選項。":"若您需要重新下载之前下载失败的章节，请开启 recheck 选项。","圖片下載錯誤":"图片下载错误","等待 %2 之後再重新取得圖片：%1":"等待 %2 之后再重新取得图片：%1","章節編號%1：":"章节编号%1：","Insert a chapter url after chapter %1":"在章节编号%1之后插入新页面","Extract ebook as cache: [%1]":"解开电子书以当作 cache：","字數過少（%1字元）":"字数过少（%1字元）","無內容":"无内容","不存在封存檔案用的目錄：%1":"不存在封存档案用的目录：%1","Preserve ":"保留旧档：","move to →":"搬移至 →","移除舊檔案：":"移除旧档案：","打包 epub 電子書：%1":"打包 epub 电子书：%1","已無閱讀卷可用。":"已无阅读卷可用。","此後的作品標題都被當作是網頁限定作品。":"此后的作品标题都被当作是网页限定作品。","下次收到閱讀券還要 %1。":"下次收到阅读券还要 %1。","還有%1張閱讀卷，且第 %2/%3 章還有沒下載過，從此章開始檢查。":"还有%1张阅读卷，且第 %2/%3 章还有没下载过，从此章开始检查。","已付費購買章節《%1》。":"已付费购买章节《%1》。","在 %1 之前（還有 %2）可以閱讀本章節《%3》。":"在 %1 之前（还有 %2）可以阅读本章节《%3》。","之前已下載過章節《%1》，不再重新購買。":"之前已下载过章节《%1》，不再重新购买。","本章節狀況不明(%1)。跳過《%1》不採用閱讀卷。":"本章节状况不明(%1)。跳过《%1》不采用阅读卷。","未設定讓本工具自動使用閱讀卷。若您並非使用安裝包，並想要讓本工具自動使用閱讀卷，請打開檔案總管，到安裝本工具的目錄下（若是您使用安裝包，就不能夠設定帳號密碼了。），在 work_crawler.configuration.js 這個檔案中設定好帳號密碼資料，以及 \"auto_use_ticket:true\"。您可以參考 work_crawler.default_configuration.js 這個檔案來做設定。":"未设定让本工具自动使用阅读卷。若您并非使用安装包，并想要让本工具自动使用阅读卷，请打开档案总管，到安装本工具的目录下（若是您使用安装包，就不能够设定帐号密码了。），在 work_crawler.configuration.js 这个档案中设定好帐号密码资料，以及 \"auto_use_ticket:true\"。您可以参考 work_crawler.default_configuration.js 这个档案来做设定。","用閱讀券閱讀《%1》。":"用阅读券阅读《%1》。","網頁改版？無法解析！":"网页改版？无法解析！","Invalid image url: %1":"图片网址错误：%1","Login as [%1]":"登入为[%1]","已收到%1項有期限的物品。":"已收到%1项有期限的物品。","下載時發生錯誤，無法順利取得檔案內容！":"下载时发生错误，无法顺利取得档案内容！","Different url: %1 ≠ %2":"网址不同：%1 ≠ %2","或許是下載的檔案出現錯誤？您可嘗試過段時間再下載，或選用 .recheck 選項來忽略 cache、重新下載每個圖片的頁面。":"或许是下载的档案出现错误？您可尝试过段时间再下载，或选用 .recheck 选项来忽略 cache、重新下载每个图片的页面。","有些篇章之URL檔名非數字：%1":"有些篇章之URL档名非数字：%1","無法解析《%1》§%2 之章節資料！":"无法解析《%1》§%2 之章节资料！","本章節上一張圖片下載成功。下載本章節下一幅圖片。":"本章节上一张图片下载成功。下载本章节下一幅图片。","第一張圖就下載失敗了。結束下載本作品。":"第一张图就下载失败了。结束下载本作品。","嘗試取得被屏蔽的作品。":"尝试取得被屏蔽的作品。","使用之前的 cache，自 §%1 接續下載。":"使用之前的 cache，自 §%1 接续下载。","因為本章節內容也被屏蔽，因此不再嘗試解析其他章節。":"因为本章节内容也被屏蔽，因此不再尝试解析其他章节。","§%1 已被屏蔽，不再嘗試解析其他章節。":"§%1 已被屏蔽，不再尝试解析其他章节。","無法解析章節資料並取得章節內容文字！":"无法解析章节资料并取得章节内容文字！","無法從章節內容中之連結抽取出圖片網址：%1":"无法从章节内容中之连结抽取出图片网址：%1","作品名稱或🆔":"作品名称或🆔","貼上":"粘贴","開始下載":"开始下载","搜尋":"搜索","搜尋各網站並下載作品。":"搜寻各网站并下载作品。","搜尋結果":"搜索结果","開啓下載目錄":"打开下载目录","線上作品網站":"在线作品网站","繁體字漫畫":"繁体字漫画","日本語のウェブコミック":"日语网络漫画","English webcomics":"英语网络漫画","日本語のオンライン小説":"日语网络小说","最愛作品清單":"我的最爱列表","下載選項":"下载选项","選擇%1路徑":"选择%1路径","未選擇檔案或目錄。":"未选择档案或目录。","選擇了%2的路徑：%1":"选择了%2的路径：%1","自動儲存選項設定與最愛作品清單#1":"自动存储选项设定","自動儲存選項設定與最愛作品清單#2":"与我的最爱列表","已設定自動儲存選項設定。":"已保存自动存储选项设定。","已設定不自動儲存選項設定。":"已取消自动存储选项设定。","重設下載選項與最愛作品清單#1":"重设下载选项","重設下載選項與最愛作品清單#2":"与我的最爱列表","已設定自動儲存選項設定":"已设定自动储存选项设定","已設定不自動儲存選項設定":"已设定不自动储存选项设定","已重設下載選項。":"已重设下载选项。","同時更改已手動設定下載目錄的網站 %1：%2 → %3":"同时更改已手动设定下载目录的网站 %1：%2 → %3","下載中的作品":"下载中的作品","清除訊息":"清除信息","顯示/隱藏訊息":"显示/隐藏信息","限制訊息行數":"限制信息行数","不限制訊息行數":"不限制信息行数","開啟偵錯工具":"启用开发工具","開始檢測並更新安裝包……":"开始检测并安装更新……","所執行的並非安裝包版本，因此不執行安裝包版本的升級檢查。":"所执行的并非安装包版本，故不执行安装包版本的升级检查。","開始檢測安裝包更新……":"开始检查更新……","有新版安裝包：%1":"有新的安装包：%1","沒有新安裝包。當前版本：%1":"没有更新。当前程序版本：%1","安裝包更新出錯：%1":"安装更新出错：%1","安裝包已下載%1，下載速度：%2":"已下载%1，下载速度：%2","新版安裝包下載完成：%1":"新版安装包下载完成：%1","重新啟動程式即可更新。":"重启软件即可完成更新。","安裝包更新失敗：%1":"安装包更新失败：%1","請在每一行鍵入一個作品名稱或🆔：":"请在每一行输入一个作品名称或🆔：","儲存最愛作品清單":"保存最爱作品清单","放棄編輯最愛作品清單":"放弃编辑最爱作品清单","儲存最愛作品清單的檔案不存在或者沒有內容。採用舊有的最愛作品列表。":"保存最爱作品清单的档案不存在或者没有内容。使用旧有的最爱作品列表。","作品已完結。":"作品已完结。","從最愛名單中注解掉本作品。":"从最爱名单中注释掉本作品。","%1 已完結的作品名稱或🆔：%2":"%1 已完结的作品名称或🆔：%2","檢查所有最愛作品之更新，並下載更新作品。":"检查所有最爱作品之更新，并下载更新作品。","🈳 尚無最愛作品。":"🈳 尚无最爱作品。","🈳 尚未設定最愛作品。":"🈳 尚未设定最爱作品。","編輯最愛作品清單":"编辑最爱作品清单","刪除所有%1個注解、%2個重複與%3個空白行。":"删除所有%1 个注解、 %2 个重复与 %3 个空白行。","列表檔案中有%1個重複作品名稱或 id。":"列表档案中有 %1 个重复作品名称或 id 。","注解掉重複的作品名稱或🆔":"注释掉重复的作品名称或🆔","刪除重複的作品名稱或🆔":"删除重复的作品名称或🆔","注解掉%1個已完結的作品名稱或🆔":"注释掉%1个已完结的作品名称或🆔","讀取本網站作品資訊檔案以判別作品是否已下載過、是否完結。":"读取本网站作品信息档案以判断作品是否已下载过、是否完结。","選擇網站時，這可能造成幾十秒鐘無回應。":"选择网站时，这可能造成几十秒钟无响应。","讀取所有網站之作品資訊檔案":"读取所有网站的作品信息档案","import configuration of %1: %2":"汇入%1的整体设定：%2","import preference of %1: %2":"汇入%1的偏好：%2","連結":"链接","網站":"网站","標題":"标题","僅於所獲得之作品標題特殊，不同於所查詢之作品標題時，才會標示。":"仅于所获得之作品标题特殊，不同于所查询之作品标题时，才会标示。","最愛":"最爱","😘: 在最愛清單中, ➕: 加入最愛清單":"😘: 在最爱清单中, ➕: 加入最爱清单","話數":"话数","章節數量":"章节数量","曾下載":"曾下载","當之前下載過時，標示上次下載到第幾章節。":"当之前下载过时，标示上次下载到第几章节。","部份章節需要付費/被鎖住/被限制":"部份章节需要付费/被锁住/被限制","作品已完結。":"作品已完结。","狀況":"状况","作品狀況":"作品状况","最新章節":"最新章节","資訊來自章節清單":"资讯来自章节清单","點擊網站名稱可下載此網站之本作品。":"点击网站名称可下载此网站之本作品。","所有網站都未能找到本作品。":"所有网站都未能找到本作品。","搜尋作品[%1]之結果：":"搜寻作品[%1]之结果：","下載所有%1個網站找到的作品":"下载所有%1个网站找到的作品","將所有%1個網站找到的作品全部加入網站各自之最愛清單":"将所有%1个网站找到的作品全部加入网站各自之最爱清单","下載所有最愛清單中的本作品":"下载所有最爱清单中的本作品","以下%1個網站未能找到本作品：":"以下%1个网站未能找到本作品：","錯誤原因":"错误原因","作品網站":"作品网站","請先在線上作品區指定要搜尋的作品類別。":"请先在线上作品区指定要搜寻的作品类别。","正在搜尋[%1]中，必須先取消當前的搜尋程序才能重新搜尋。":"正在搜寻[%1]中，必须先取消当前的搜寻程序才能重新搜寻。","正在搜尋[%1]中……":"正在搜寻[%1]中……","尚無任何網站回傳結果……":"尚无任何网站回传结果……","取消搜尋":"取消搜寻","放棄還沒搜尋完成的網站":"放弃还没搜寻完成的网站","本網站強制等待時間過長，為防封鎖不作搜尋。":"本网站强制等待时间过长，为防封锁不作搜寻。","%1個網站仍在搜尋中：%2":"%1个网站仍在搜寻中：%2","請先輸入作品名稱或🆔。":"请先输入作品名称或🆔。","請先指定要下載的網站。":"请先指定要下载的网站。","當前路徑：%1":"当前路径：%1","載入並使用下載工具 %1":"载入并使用下载工具 %1","選擇下載工具：%1":"选择下载工具：%1","下載任務初始化、讀取作品資訊中……":"下载任务初始化、读取作品资讯中……","暫停":"暂停","繼續":"继续","暫停/恢復下載":"暂停/恢复下载","取消下載":"取消下载","開啓作品下載目錄":"打开作品下载目录","正在從%1下載《%2》這個作品。將等到這個作品下載完畢，或者取消下載後，再下載 %3。":"正在从%1下载《%2》这个作品。将等到这个作品下载完毕，或者取消下载后，再下载 %3。","重新下載":"重新下载","清除本下載紀錄":"清除本下载纪录","（總共有%1個錯誤）":"（总共有%1个错误）","自動更新非安裝包版本中……":"自动更新非安装包版本中……","非安裝包版本更新失敗：%1":"非安装包版本更新失败：%1","非安裝包版本更新完畢。您需要重新啟動程式以使用新版本。":"非安装包版本更新完毕，您需要重启软件以使用新的版本。","重新讀取應用程式之網頁部分":"重新读取应用程式之网页部分","建議重新啟動應用程式以使用完整更新後的程式。":"建议重新启动应用程式以使用完整更新后的程式。","已設定不自動更新。":"已设定不自动更新。","檢查更新中……":"检查更新中……","有新版本：%1":"发现新版本：%1","未發現新版本。":"未发现新版本。","無法讀取版本資訊 package.json！":"无法读取版本资讯 package.json！","更新檢測失敗：%1":"更新检测失败：%1","更新失敗！":"更新失败！","本欄基本上僅供調試使用。若您有下載功能方面的需求，煩請提報議題，謝謝。":"本栏基本上仅供调试使用。若您有下载功能方面的需求，烦请提报议题，谢谢。","Invalid theme name: %1":"无此布景名称：%1","布景主題：":"主题：","light theme":"明亮","dark theme":"暗黑","Unknown type: %1, please install %2":"无法处理压缩类型 %1，请安装程式 %2","Callback execution error!":"回呼函式执行出错！","%1 execution error!":"%1 执行出错！","Duplicate FSO path: %1":"档案或目录路径冲突：%1","%1 未提供這種功能：%2":"%1 未提供这种功能：%2","在壓縮檔所在目錄下操作 %1。":"在压缩档所在目录下操作 %1。","Changing working directory: [%1]→[%2]":"改变操作目录：[%1]→[%2]","本函式庫尚不支援多 rootfile (.opf)！":"本函式库尚不支援多 rootfile (.opf)！","Invalid id prefix: %1":"id 前缀无效：%1","未設定電子書章節目錄，將把所有章節內容直接放在電子書根目錄底下！":"未设定电子书章节目录，将把所有章节内容直接放在电子书根目录底下！","%2: The target directory [%1] does not exist?":"%2：不存在标的目录 [%1]？","%3: %1: %2 files / directories to check.":"%3：%1：将检查 %2 个档案或目录。","Create directory of sub-catalog [%1]:":"创建子分类 %1 的目录：","Invalid catalog: %1":"子分类无效：%1","因為最大的檔案有 %1 bytes，因此跳過這個%2的目錄：%3":"因为最大的档案有 %1 bytes，因此跳过这个%2的目录：%3","Can not read file / directory: %1":"无法读取档案或目录 %1","為遊戲可執行檔或函式庫":"为游戏可执行档或函式库","Can not read directory: %1":"无法读取目录 %1","Empty directory: %1":"空目录：%1","含有 %1/%2 個可執行檔或函式庫":"含有 %1/%2 个可执行档或函式库","含有 %1/%2 張圖片":"含有 %1/%2 张图片","次目錄中含有可執行檔或函式庫":"次目录中含有可执行档或函式库","需要手動檢查的目錄：%1":"需要手动检查的目录：%1","Move %1: ":"搬移 %1：","Move %1:":"搬移 %1：","Remove empty directory: %1":"删除空目录：","Directory of sub-catalog [%1] created: %2":"已创建子分类 %1 的目录：%2","%2: %1 directories to compress.":"%2: 压缩%1个目录。","因為未設定要壓縮 (do_compress)，有 %1 個檔案或資料夾沒有壓縮。":"因为未设定要压缩 (do_compress)，有 %1 个档案或资料夹没有压缩。","%1/%2 compressing":"%1/%2 压缩中","Compress":"压缩","Target exists: %1":"已存在压缩标的：%1","Compress %1:":"压缩 %1：","Working directory: %1":"当前操作目录：%1","所有環境變數：%1":"所有环境变数：%1","Default download location: %1":"默认下载位置：%1","複製貼上快速鍵":"快捷键","複製選取的項目：":"复制：","貼上項目：":"粘贴：","歡迎與我們一同翻譯介面文字！#1":"欢迎与我们一同","歡迎與我們一同翻譯介面文字！#2":"翻译界面文字","歡迎與我們一同翻譯介面文字！#3":"！","現有%1條%2訊息尚未翻譯，歡迎您一同參與翻譯訊息！":"现有%1条%2讯息尚未翻译，欢迎您一同参与翻译讯息！","untranslated message count":"372","using language":"简体中文"},
'cmn-Hans-CN');