let chart = null;

function chartColors() {
  const dark = document.body.classList.contains('dark');
  return {
    line:  dark ? '#6a6a64' : '#b4b2a9',
    grid:  dark ? 'rgba(150,155,170,0.12)' : 'rgba(136,135,128,0.15)',
    tick:  dark ? '#7a7a74' : '#888780',
    title: dark ? '#7a7a74' : '#888780',
  };
}

/**
 * 数値を小数点以下 d 桁に丸めて返す。
 * toFixed() は文字列を返すため parseFloat で数値に戻している。
 * @param {number} v - 丸める値
 * @param {number} d - 有効桁数（デフォルト 3）
 */
function fmt(v, d = 3) {
  return parseFloat(v.toFixed(d));
}

/**
 * メイン処理：入力値を読み取り、計算・描画をすべて行う。
 * 各 input の "input" イベント、およびページ初期化時に呼ばれる。
 */
function compute() {

  // ----- 入力値の取得 -----
  const a = parseFloat(document.getElementById('coef-a').value);
  const b = parseFloat(document.getElementById('coef-b').value);
  const c = parseFloat(document.getElementById('coef-c').value);
  const xMin = parseFloat(document.getElementById('dom-min').value);  // 定義域の左端
  const xMax = parseFloat(document.getElementById('dom-max').value);  // 定義域の右端
  const err = document.getElementById('error-msg');

  // ----- バリデーション -----
  // いずれかの入力が数値として解釈できない場合
  if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(xMin) || isNaN(xMax)) {
    err.textContent = '有効な数値を入力してください。';
    return;
  }
  // 定義域が逆転または一点の場合
  if (xMin >= xMax) {
    err.textContent = '定義域: 最小値 < 最大値 となるように入力してください。';
    return;
  }
  // a = 0 は二次関数ではなく一次関数になる
  if (a === 0) {
    err.textContent = 'a ≠ 0 の二次関数を入力してください（a = 0 は一次関数です）。';
    return;
  }
  err.textContent = '';  // エラーなしのとき表示をクリア

  // ----- 数式文字列の生成 -----
  // a = 1 なら "1x²" でなく "x²"、a = -1 なら "-x²" と表示
  const aDisp = a === 1 ? '' : a === -1 ? '-' : String(a);
  const bAbs = Math.abs(b);
  const cAbs = Math.abs(c);
  let formula = `f(x) = ${aDisp}x²`;
  if (b > 0) formula += ` + ${b}x`;
  else if (b < 0) formula += ` − ${bAbs}x`;  // マイナスは全角ハイフンで表示
  if (c > 0) formula += ` + ${c}`;
  else if (c < 0) formula += ` − ${cAbs}`;
  document.getElementById('formula-display').textContent = formula;

  // ----- グラフ描画用の点列生成 -----
  // 定義域を N 分割し、各 x に対して y = f(x) を計算する
  const N = 400;                        // 分割数（多いほど滑らか）
  const step = (xMax - xMin) / N;      // 1 ステップの幅
  const xs = [], ys = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + i * step;
    xs.push(x);
    ys.push(a * x * x + b * x + c);
  }

  // ----- 頂点の計算 -----
  // 頂点の x 座標：x = -b / 2a（平方完成の結果）
  // 頂点の y 座標：y = c - b² / 4a（判別式の変形）
  const vx = fmt(-b / (2 * a));
  const vy = fmt(c - b * b / (4 * a));

  // ----- 最大値・最小値の解析的計算 -----
  // 閉区間上の連続関数の最大・最小は「端点」か「区間内の極値（頂点）」で実現する。
  // 離散近似ではなく解析的に候補点を列挙して正確な値を求める。
  const f = x => a * x * x + b * x + c;  // 二次関数 f(x) の定義

  // 候補点リスト：まず両端を追加
  const candidates = [
    { x: xMin, y: f(xMin) },
    { x: xMax, y: f(xMax) },
  ];
  // 頂点が定義域の内部（端点を除く）にある場合のみ候補に追加
  if (-b / (2 * a) > xMin && -b / (2 * a) < xMax) {
    candidates.push({ x: -b / (2 * a), y: f(-b / (2 * a)) });
  }

  // 候補点の中から最小値・最大値を取り出す
  const minY = fmt(Math.min(...candidates.map(p => p.y)));
  const maxY = fmt(Math.max(...candidates.map(p => p.y)));

  // 浮動小数点の誤差を考慮した許容範囲（イプシロン）
  const EPS = 1e-9;

  // 最小値・最大値を実現する x 座標をすべて収集する（複数点対応）。
  // 例：放物線が対称で両端の y 値が等しい場合は 2 点になる。
  const minPoints = candidates
    .filter(p => Math.abs(p.y - minY) < EPS)
    .map(p => ({ x: fmt(p.x), y: minY }));
  const maxPoints = candidates
    .filter(p => Math.abs(p.y - maxY) < EPS)
    .map(p => ({ x: fmt(p.x), y: maxY }));

  // ----- 統計カードの更新 -----
  // 最小値・最大値の x 座標が複数ある場合はカンマ区切りで並べる
  const minCoords = minPoints.map(p => `x = ${p.x}`).join(',  ');
  const maxCoords = maxPoints.map(p => `x = ${p.x}`).join(',  ');
  document.getElementById('stats-area').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">最小値</div>
      <div class="stat-value stat-min">${minY}</div>
      <div class="stat-coord">${minCoords},  y = ${minY}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">最大値</div>
      <div class="stat-value stat-max">${maxY}</div>
      <div class="stat-coord">${maxCoords},  y = ${maxY}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">頂点（軸対称の中心）</div>
      <div class="stat-value stat-vertex" style="font-size:15px;">(${vx}, ${vy})</div>
      <div class="stat-coord">x = −b / 2a = ${vx}</div>
    </div>
  `;

  // ----- 軸の描画範囲の計算 -----
  // グラフの端に点が張り付かないよう、定義域・値域の外側にパディングを加える。

  // x 軸：定義域の幅の 8% を両端に足す
  const xRange = xMax - xMin;
  const xPad = xRange * 0.08 || 0.5;   // 幅が 0 のときのフォールバックとして 0.5
  const xAxisMin = xMin - xPad;
  const xAxisMax = xMax + xPad;

  // y 軸：値域の振れ幅の 22% を上下に足す
  const yPad = (maxY - minY) * 0.22 || 1;  // 振れ幅が 0 のときのフォールバックとして 1
  const yAxisMin = minY - yPad;
  const yAxisMax = maxY + yPad;

  // ----- Chart.js データセットの定義 -----
  // order が小さいほど前面に描画される（散布点を曲線の上に重ねる）

  // メインデータ：点列を {x, y} オブジェクト配列に変換
  const mainData = xs.map((x, i) => ({ x: fmt(x), y: fmt(ys[i]) }));

  const datasets = [
    // ① f(x) の曲線（折れ線グラフとして描画、点は非表示）
    {
      label: 'f(x)',
      data: mainData,
      borderColor: chartColors().line,
      borderWidth: 2,
      pointRadius: 0,           // 各点のドットは描かない
      tension: 0.3,             // ベジェ曲線で滑らかに
      fill: false,
      type: 'line',
      order: 4,                 // 最背面
    },
    // ② 最小値点（複数点対応）：青い丸
    {
      label: `最小値 y = ${minY}`,
      data: minPoints,          // 1 点以上の配列
      type: 'scatter',
      pointRadius: 8,
      pointHoverRadius: 10,
      backgroundColor: '#185FA5',
      borderColor: '#0C447C',
      borderWidth: 2,
      order: 1,                 // 最前面に近い
    },
    // ③ 最大値点（複数点対応）：赤い丸
    {
      label: `最大値 y = ${maxY}`,
      data: maxPoints,          // 1 点以上の配列
      type: 'scatter',
      pointRadius: 8,
      pointHoverRadius: 10,
      backgroundColor: '#E24B4A',
      borderColor: '#A32D2D',
      borderWidth: 2,
      order: 2,
    },
    // ④ 頂点：緑の三角形
    {
      label: `頂点 (${vx}, ${vy})`,
      data: [{ x: vx, y: vy }],
      type: 'scatter',
      pointRadius: 7,
      pointHoverRadius: 9,
      pointStyle: 'triangle',   // 三角形マーカー
      backgroundColor: '#639922',
      borderColor: '#3B6D11',
      borderWidth: 2,
      order: 3,
    }
  ];

  // ----- アノテーション（補助点線）の生成 -----
  // 各最小値・最大値の点から軸へ向けて垂直線と水平線を引く。
  // 点が複数ある場合はそれぞれの x 座標に垂直線を追加する。
  const annotations = {};

  // 最小値の垂直補助線：各点の x から y 軸下端まで
  minPoints.forEach((p, i) => {
    annotations[`minXLine${i}`] = {
      type: 'line', xMin: p.x, xMax: p.x,
      yMin: yAxisMin, yMax: minY,
      borderColor: 'rgba(24,95,165,0.4)', borderWidth: 1.5, borderDash: [4, 3],
    };
  });
  // 最小値の水平補助線：グラフ左端から最も右の最小値点まで
  annotations.minYLine = {
    type: 'line', xMin: xAxisMin, xMax: Math.max(...minPoints.map(p => p.x)),
    yMin: minY, yMax: minY,
    borderColor: 'rgba(24,95,165,0.4)', borderWidth: 1.5, borderDash: [4, 3],
  };

  // 最大値の垂直補助線：各点の x から y 軸下端まで
  maxPoints.forEach((p, i) => {
    annotations[`maxXLine${i}`] = {
      type: 'line', xMin: p.x, xMax: p.x,
      yMin: yAxisMin, yMax: maxY,
      borderColor: 'rgba(226,75,74,0.4)', borderWidth: 1.5, borderDash: [4, 3],
    };
  });
  // 最大値の水平補助線：グラフ左端から最も右の最大値点まで
  annotations.maxYLine = {
    type: 'line', xMin: xAxisMin, xMax: Math.max(...maxPoints.map(p => p.x)),
    yMin: maxY, yMax: maxY,
    borderColor: 'rgba(226,75,74,0.4)', borderWidth: 1.5, borderDash: [4, 3],
  };

  // ----- Chart.js グラフの再描画 -----
  // 既存のチャートがあれば必ず destroy() してからインスタンスを作り直す
  // （destroy しないと Canvas の内部状態が残りメモリリークが起きる）
  if (chart) { chart.destroy(); }

  chart = new Chart(document.getElementById('qfChart'), {
    type: 'scatter',        // ベースタイプ（各 dataset で個別に上書きも可）
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,   // chart-wrap の高さ固定に従わせる
      animation: { duration: 250 }, // 再描画アニメーション 250ms
      plugins: {
        legend: { display: false }, // 凡例は HTML 側で独自実装するので非表示
        tooltip: {
          callbacks: {
            // ツールチップに「(x, y)」形式で座標を表示
            label: ctx => `(${ctx.parsed.x.toFixed(3)}, ${ctx.parsed.y.toFixed(3)})`
          }
        },
        annotation: { annotations }  // chartjs-plugin-annotation の設定
      },
      scales: {
        // x 軸：パディング込みの範囲を設定
        x: {
          type: 'linear',
          min: xAxisMin, max: xAxisMax,
          title: { display: true, text: 'x', color: chartColors().title, font: { size: 12 } },
          grid: { color: chartColors().grid },
          ticks: { color: chartColors().tick, font: { size: 11 }, maxTicksLimit: 11 }
        },
        y: {
          min: yAxisMin, max: yAxisMax,
          title: { display: true, text: 'y', color: chartColors().title, font: { size: 12 } },
          grid: { color: chartColors().grid },
          ticks: { color: chartColors().tick, font: { size: 11 }, maxTicksLimit: 9 }
        }
      }
    }
  });
}

// ----- イベントリスナーの登録 -----
// 5 つの入力フィールドのいずれかが変更されるたびに compute() を呼ぶ
['coef-a', 'coef-b', 'coef-c', 'dom-min', 'dom-max'].forEach(id => {
  document.getElementById(id).addEventListener('input', compute);
});

// テーマ復元 → 初期描画
const _saved = localStorage.getItem('math-theme');
if (_saved === 'dark') document.body.classList.add('dark');

compute();

const _themeBtn = document.getElementById('theme-toggle');
_themeBtn.textContent = document.body.classList.contains('dark') ? '☀ ライト' : '🌙 ダーク';
_themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  localStorage.setItem('math-theme', dark ? 'dark' : 'light');
  _themeBtn.textContent = dark ? '☀ ライト' : '🌙 ダーク';
  compute();
});
