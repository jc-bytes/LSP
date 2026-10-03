const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const context = { window: {}, document: { addEventListener() {} }, Intl, Date, URL, console };
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../ui/pages.js'),'utf8'),context);
const ui = context.window.LspPresentation;
test('metadata placeholders do not claim reference readiness', () => {
 assert.equal(ui.referenceReady({mediapipe_reference:{status:'ready'}}),false);
 assert.equal(ui.referenceReady({mediapipe_reference:{version:2,frames:[1,2,3]}}),false);
 assert.equal(ui.referenceReady({mediapipe_reference:JSON.stringify({version:2,frames:[1,2,3,4]})}),true);
 assert.equal(ui.referenceReady({mediapipe_reference:{version:4,landmarkFrames:[1,2,3,4]}}),true);
 assert.equal(ui.referenceReady({media_url:'https://example.com/video.mp4'}),true);
});
test('only completed comparisons reveal results, including a real zero score', () => {
 assert.equal(ui.isComparisonReady({sourceId:'learner-motion',value:{score_overall:90}}),false);
 assert.equal(ui.isComparisonReady({sourceId:'js-lab',value:{score_overall:null}}),false);
 assert.equal(ui.isComparisonReady({sourceId:'js-lab',value:{score_overall:0}}),true);
});
test('retry links retain the exact practice context', () => {
 const url = new URL(ui.practiceHref('practice-1'),'http://localhost/pages/');
 assert.deepEqual(JSON.parse(url.searchParams.get('context-record')),{dataSourceId:'supabase-table_practices',recordId:'practice-1'});
});
test('dates use Panama time and invalid dates are explained', () => {
 assert.equal(ui.formatDate('invalid'),'Fecha no disponible');
 assert.match(ui.formatDate('2026-10-02T02:00:00Z'),/1/);
});
