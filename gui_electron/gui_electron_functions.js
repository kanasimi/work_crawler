var initialization = function initialization() {
	initialization = null;

	CeL.run([ 'application.debug.log' ], function() {
		CeL.Log.set_board('log_panel');
		// CeL.set_debug();
		// CeL.debug('Log panel setted.');
		CeL.Log.clear();
	});

	CeL.new_node([ {
		T : 'recheck',
		C : 'download_options',
		onclick : function() {
			var operator = get_operator();
			operator.recheck = !operator.recheck;
			CeL.set_class(this, 'selected', {
				remove : operator.recheck
			});
		}
	}, ':', '從頭檢測所有作品之所有章節與所有圖片。', {
		br : null
	} ], 'download_options_panel');
};

// work_crawler/
var base_directory = '../';
require(base_directory + 'work_crawler_loder.js');
initialization();

function get_operator() {
	var operator = base_directory
			+ document.getElementById('input_site_id').value + '.js';
	// console.log(process.cwd());
	// console.log('Load ' + operator);
	operator = require(operator);

	return operator;
}

function start_gui_task() {
	var operator = get_operator();

	// initialization && initialization();

	var work_id = CeL.node_value('#input_work_id');
	if (work_id) {
		operator.start(work_id);
	} else {
		CeL.log('請輸入作品名稱');
	}
}
