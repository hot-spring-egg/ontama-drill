# 🥚 おんたまドリル（ポータル）

小学生向けの学習ドリルアプリを ひとつの入口に あつめたポータルです。
どのドリルに どれだけ 取り組んだかが スコアとして たまり、
20段階の ランクが 上がっていきます。

公開先: <https://hot-spring-egg.github.io/ontama-drill/>

---

## ✨ できること

- 学習アプリ・学習サイトを **カード一覧** から ひらける
- 取り組んだ量が **スコア** としてたまり、**Lv.1〜20 のランク**が上がる
- ランクごとの称号と、つぎのランクまでの のこり点を表示
- **PWA**（Chrome / Edge / Safari から アプリとして インストール可能・オフライン対応）

カードは 2つのグループに 分かれています。

| グループ | 内容 |
| --- | --- |
| スコアが たまる ドリル | おんたまドリルの アプリ。取り組むと スコアが 加算される |
| つかっていい サイト | タイピング練習・プログラミングなど。スコアには 入らない |

---

## ⭐ スコアのしくみ

スコアは `localStorage` の **`gogo_drill_score`**（整数）に たまります。
ポータルと 各ドリルは **同じオリジン**（`hot-spring-egg.github.io`）に
置かれているため、この 1つの値を 共有できます。

| ドリル | 1回あたりの ポイント |
| --- | --- |
| 100マスけいさん | 取り組んだ（数字を入れた）マスの数だけ |
| けいさんカード | 20 ポイント |
| 九九カード | 20 ポイント |
| そのほかのドリル | 各アプリの実装による |

### ドリル側の 組みこみかた

各アプリに **`ontamaScore.js`** を置きます（ロジックは全アプリで同一。
ESM 版と グローバル版があり、形式は アプリの構成に合わせてよい）。

```js
// ESM（ビルドするアプリ）
import { addOntamaScore } from './ontamaScore.js';
addOntamaScore(20);

// グローバル（<script> で読みこむアプリ）
window.OntamaScore && window.OntamaScore.add(20);
```

- 正の整数だけを受けつけ、こわれた値や 保存できない環境（プライベート
  モードなど）でも **アプリを止めません**
- 上限は 1億点。バグで 天文学的な値になっても 表示が こわれないように
- ⚠️ `gogo_drill_score` は **アプリ間で共有** する値です。記録リセットや
  クリーンアップの対象に **入れないでください**（`localStorage.clear()`
  も 同じ理由で つかってはいけません）

---

## 🧩 ドリルを ふやすには

`index.html` の中の `APPS` 配列に 1件 足すだけです。

```js
{
  id: 'square100',            // 一意なID
  title: '100マスけいさん',
  grade: '1ねんせい〜',
  icon: 'grid100',            // <symbol id="i-grid100"> の名前
  desc: 'たて・よこ10マスにちょうせん！',
  points: 'といたマスの かずだけ ポイント',   // 任意。カードに小さく出る
  url: 'https://hot-spring-egg.github.io/online-100square-calculation/',
  color: '#457B9D',
  scored: true,               // true でスコア対象グループへ
  pale: false,                // 背景がうすい色のときだけ true（文字色を反転）
}
```

アイコンは `index.html` 冒頭の SVG スプライトに `<symbol id="i-〇〇">`
として足します（24×24 の線画・`stroke-width: 2`）。

`hot-spring-egg.github.io` 以外の URL は 自動で **別タブ**でひらきます
（インストールしたアプリの中に よそのサイトを かかえこまないため）。

---

## 🛠 技術構成

外部ライブラリは **つかっていません**。`index.html` 1ファイル（HTML +
CSS + JS）と マニフェスト・Service Worker・アイコンだけです。

> 以前は React / Babel standalone / Tailwind / lucide を CDN から
> 読みこんでいましたが、画面の中身は カード一覧と ランク表示だけで、
> ブラウザ内で JSX を翻訳するコスト（Babel standalone だけで 数MB）に
> 見合いませんでした。見た目は そのままに、素の HTML/CSS/JS に
> 置きかえてあります。おかげで オフラインでも 確実に ひらけます。

```
ontama-drill/
├── index.html            アプリ本体（ここだけ直せば中身を変えられる）
├── manifest.webmanifest  PWA の設定（id / scope / start_url は要注意）
├── sw.js                 Service Worker（更新したら VERSION を上げる）
├── favicon.png
└── icons/                192 / 512 / maskable / apple-touch-icon
```

### 📲 PWA についての注意

`hot-spring-egg.github.io` には 多数のアプリが 同居しています。
ブラウザは manifest の **`id` / `scope`** で アプリを 見わけているため、
このリポジトリを コピーして 別アプリを作るときは
`id` `scope` `start_url` を **かならず** 新しいフォルダ名に 書きかえて
ください。書きかえ忘れると「このアプリのページが 別のアプリの
ウィンドウで ひらく」取りちがえが 起きます。

Service Worker が そうじするのは `ontama-portal-` で始まる 自分の
キャッシュだけです。ここを 全消しにすると、同じサイトに置いた
ほかのドリルの オフラインデータまで 巻きぞえで 消えます。

---

## 🚀 ローカルで試す

```
python3 -m http.server 8000
# → http://localhost:8000/ を開く
```
