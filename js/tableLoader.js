'use strict'

function loadData() {
	var db = openDatabase('mydb', '1.0', 'Test DB', 3 * 1024 * 1024);
	return Promise.all([
		fetch('/UCD/UnicodeData.txt'),
		fetch('/UCD/Blocks.txt'),
		fetch('/UCD/Scripts.txt')
	]).then(function (responses) {
		return Promise.all(responses.map(resp=>resp.text()));
	}).then(function (data) {
		var unicodeDataSource = data[0];
		var blocksSource = data[1];
		var scriptsSource = data[2];
		return Promise.all([
			new Promise(prepareUnicodeDataTable)
				.then(function(){ return new Promise(parseUnicodeData)}),
			new Promise(prepareBlockTable)
				.then(function(){ return new Promise(parseBlock)}),
			new Promise(prepareScriptTable)
				.then(function(){ return new Promise(parseScript)})
		]).then(function () {
			return db;
		});

		function prepareUnicodeDataTable(res, rej){
			db.transaction(function (tx) {
				tx.executeSql("DROP TABLE IF EXISTS UNICODE_DATA");
				tx.executeSql(`
					CREATE TABLE IF NOT EXISTS UNICODE_DATA (
						CODE_VALUE UNIQUE,
						CHARACTER_NAME,
						GENERAL_CATEGORY,
						CANONICAL_COMBINING_CLASSES,
						BIDIRECTIONAL_CATEGORY,
						CHARACTER_DECOMPOSITION_MAPPING,
						DECIMAL_DIGIT_VALUE,
						DIGIT_VALUE,
						NUMERIC_VALUE,
						MIRRORED,
						UNICODE_1_0_NAME,
						_10646_COMMENT_FIELD,
						UPPERCASE_MAPPING,
						LOWERCASE_MAPPING,
						TITLECASE_MAPPING
					)
				`);
			}, function (e) { 
				rej(e);
			}, res);
		}
		function parseUnicodeData(res, rej){
			db.transaction(function (tx) {
				unicodeDataSource
					.split('\n')
					.slice(0,-1)
					.forEach(function (rec) {
						tx.executeSql(`
							INSERT INTO UNICODE_DATA (
								CODE_VALUE,
								CHARACTER_NAME,
								GENERAL_CATEGORY,
								CANONICAL_COMBINING_CLASSES,
								BIDIRECTIONAL_CATEGORY,
								CHARACTER_DECOMPOSITION_MAPPING,
								DECIMAL_DIGIT_VALUE,
								DIGIT_VALUE,
								NUMERIC_VALUE,
								MIRRORED,
								UNICODE_1_0_NAME,
								_10646_COMMENT_FIELD,
								UPPERCASE_MAPPING,
								LOWERCASE_MAPPING,
								TITLECASE_MAPPING
							) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
						`, rec.split(';'));
					});
			}, function (e) { 
				rej(e);
			}, res);
		}
		function prepareBlockTable(res, rej) {
			db.transaction(function (tx) {
				tx.executeSql("DROP TABLE IF EXISTS BLOCK");
				tx.executeSql(`
					CREATE TABLE IF NOT EXISTS BLOCK (
						BLOCK_NAME,
						START_CODE,
						END_CODE
					)
				`);
			}, function (e) { 
				rej(e);
			}, res);
		}

		function parseBlock(res, rej) {
			db.transaction(function (tx) {
				blocksSource
					.split('\n')
					.slice(34,296)
					.forEach(function (rec) {
						tx.executeSql(
							'INSERT INTO BLOCK (START_CODE,END_CODE,BLOCK_NAME) VALUES (?,?,?)'
							, rec.split(/\.\.|; /g)
						);
					});
			}, function (e) { 
				rej(e);
			}, res);
		}
		function prepareScriptTable(res, rej){
			db.transaction(function (tx) {
				tx.executeSql("DROP TABLE IF EXISTS SCRIPT");
				tx.executeSql(`
					CREATE TABLE IF NOT EXISTS SCRIPT (
						SCRIPT_NAME,
						START_CODE,
						END_CODE
					)
				`);
			}, function (e) { 
				rej(e);
			}, res);
		}
		function parseScript(res, rej){
			db.transaction(function (tx) {
				scriptsSource
					.split('\n')
					.map(rec=>rec.replace(/\s*#.*/,''))
					.filter(rec=>rec)
					.forEach(function (rec) {
						var rec =rec.split(/\.\.|\s*;\s*/g);
						if (rec.length ==3) {
							tx.executeSql(
								'INSERT INTO SCRIPT (START_CODE,END_CODE,SCRIPT_NAME) VALUES (?,?,?)', 
								rec
							);
						} else {
							tx.executeSql(
								'INSERT INTO SCRIPT (START_CODE,SCRIPT_NAME) VALUES (?,?)', 
								rec
							);
						}
					});
			}, function (e) { 
				rej(e);
			}, res);
		}
	});
};

loadData().then(function (db) {
	// body...
}).catch(function (e) {
	console.log(e);
});