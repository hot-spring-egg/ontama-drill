/* =====================================================================
 *  おんたまドリル 共通スコア（グローバル版）
 *  ---------------------------------------------------------------------
 *  ポータル（ontama-drill）と 同じオリジンにいるので、
 *  localStorage の 'gogo_drill_score' を 共有して スコアを たす。
 *
 *    window.OntamaScore.add(15);   // 15 てん たす（あたらしい合計を返す）
 *    window.OntamaScore.read();    // いまの合計
 *
 *  ・正の整数だけ うけつける（0・マイナス・NaN は 何もしない）
 *  ・こわれた値 / 保存できない環境（プライベートモード等）でも 止まらない
 *  ・上限は 1億点（ポータルの表示が こわれないように）
 *  ⚠ この値は アプリ間で共有。リセットや localStorage.clear() で
 *    消してはいけない。
 * ===================================================================== */
(function (global) {
  'use strict';

  var KEY = 'gogo_drill_score';
  var MAX = 100000000;

  function read() {
    var raw = null;
    try { raw = global.localStorage.getItem(KEY); } catch (e) { /* 保存できない環境 */ }
    var n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? Math.min(n, MAX) : 0;
  }

  function add(points) {
    var p = Math.floor(Number(points));
    if (!Number.isFinite(p) || p <= 0) return read();
    var next = Math.min(MAX, read() + p);
    try { global.localStorage.setItem(KEY, String(next)); } catch (e) { /* 保存できなくても 続ける */ }
    return next;
  }

  global.OntamaScore = { add: add, read: read, KEY: KEY };
})(window);
