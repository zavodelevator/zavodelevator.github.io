let l_trans;
let params_trans;
let engine_params;
let working_angle;
let weight_product;
let pi = 3.1415926535;
let price_sh_transporter;
let production_sh_transporter;
let chek_chose_radio;
const SHNEK_API = '';
let shnekApiData = null;
let equal_engene_redukt_for_params = [
  [102,1,1.1],[102,2,1.1],[102,3,1.5],[102,4,1.5],[102,5,1.5],[102,6,1.5],[102,7,2.2],[102,8,2.2],[102,9,2.2],[102,10," Невідомо "],[102,11," Невідомо "],[102,12," Невідомо "],[102,13," Невідомо "],[102,14," Невідомо "],[102,15," Невідомо "],[102,16," Невідомо "],[102,17," Невідомо "],[102,18," Невідомо "],[102,19," Невідомо "],[102,20," Невідомо "],
  [127,1,1.5],[127,2,1.5],[127,3,1.5],[127,4,1.5],[127,5,2.2],[127,6,2.2],[127,7,2.2],[127,8,2.2],[127,9,3],[127,10,3],[127,11," Невідомо "],[127,12," Невідомо "],[127,13," Невідомо "],[127,14," Невідомо "],[127,15," Невідомо "],[127,16," Невідомо "],[127,17," Невідомо "],[127,18," Невідомо "],[127,19," Невідомо "],[127,20," Невідомо "],
  [159,1,2.2],[159,2,2.2],[159,3,2.2],[159,4,2.2],[159,5,3],[159,6,3],[159,7,3],[159,8,3],[159,9,4],[159,10,4],[159,11,4],[159,12,4],[159,13," Невідомо "],[159,14," Невідомо "],[159,15," Невідомо "],[159,16," Невідомо "],[159,17," Невідомо "],[159,18," Невідомо "],[159,19," Невідомо "],[159,20," Невідомо "],
  [219,1,3],[219,2,3],[219,3,3],[219,4,3],[219,5,4],[219,6,4],[219,7,4],[219,8,4],[219,9,4],[219,10,4],[219,11,5.5],[219,12,5.5],[219,13," Невідомо "],[219,14," Невідомо "],[219,15," Невідомо "],[219,16," Невідомо "],[219,17," Невідомо "],[219,18," Невідомо "],[219,19," Невідомо "],[219,20," Невідомо "],
  [250,1,3],[250,2,3],[250,3,3],[250,4,3],[250,5,4],[250,6,4],[250,7,4],[250,8,5],[250,11,5],[250,10,7.5],[250,11,7.5],[250,12,7.5],[250,13," Невідомо "],[250,14," Невідомо "],[250,15," Невідомо "],[250,16," Невідомо "],[250,17," Невідомо "],[250,18," Невідомо "],[250,19," Невідомо "],[250,20," Невідомо "],
  [300,1,3],[300,2,3],[300,3,4],[300,4,4],[300,5,4],[300,6,4],[300,7,5.5],[300,8,5.5],[300,9,5.5],[300,10,5.5],[300,11,7.5],[300,12,7.5],[300,13," Невідомо "],[300,14," Невідомо "],[300,15," Невідомо "],[300,16," Невідомо "],[300,17," Невідомо "],[300,18," Невідомо "],[300,19," Невідомо "],[300,20," Невідомо "]
];
init_varible_value();
chose_kvt();
chek_chose_radio = $("#exampleRadios2").prop("checked");
$("#calck_price").click(function(){ init_varible_value(); prace_vue(); chose_kvt(); });
$( ".form-check-input_engyne" ).change(function(){ chek_chose_radio = $("#exampleRadios2").prop("checked"); build_select_engin(); $(".price").empty(); renderScrewInfo(); });
$("#params_trans").on("change", function(){ init_varible_value(); chose_kvt(); renderScrewInfo(); });
$("#length_trans").on("change", function(){ init_varible_value(); chose_kvt(); renderScrewInfo(); });
initShnekApi();
initScrewMaterials();
function init_varible_value() {
  l_trans = $('#length_trans option:selected').val();
  params_trans = $('#params_trans option:selected').val().split(',');
  engine_params = $('#engine_params option:selected').val().split(',');
  working_angle = $('#working_angle').val() ? $('#working_angle').val().split(',')*1 : 0;
  weight_product = $('#weight_product').val() ? $('#weight_product').val().split(',')*1 : 0;
}
function chose_kvt(){
  equal_engene_redukt_for_params.forEach(function(element){
    if(params_trans[0]==element[0] && l_trans==element[1]){
      $(".need_engyne").html("" + element[2]+ " кВт.");
    }
  });
  if($(".need_engyne").text().includes("Невідомо")){ $(".need_engyne").html(''); }
}
function build_select_engin() {
  if(chek_chose_radio == false){
    $("#engine_params").html(
      '<option selected value="0,0,0">Без двигуна</option>'+
      '<option value="1500,1.1,5470">Мотор 1.1 кВт. 1500 об./хв.</option>'+
      '<option value="1500,1.5,6053">Мотор 1.5 кВт. 1500 об./хв.</option>'+
      '<option value="1500,2.2,9206">Мотор 2.2 кВт. 1500 об./хв.</option>'+
      '<option value="1500,3.0,8198">Мотор 3.0 кВт. 1500 об./хв.</option>'+
      '<option value="1500,4.0,10656">Мотор 4.0 кВт. 1500 об./хв.</option>'+
      '<option value="1500,5.5,14834">Мотор 5.5 кВт. 1500 об./хв.</option>'+
      '<option value="1500,7.5,19301">Мотор 7.5 кВт. 1500 об./хв.</option>'+
      '<option value="1500,11.0,23904">Мотор 11.0 кВт. 1500 об./хв.</option>'
    );
  } else {
    $("#engine_params").html(
      '<option selected value="0,0,0">Без мотор-редуктора</option>'+
      '<option value="0,1.1,11848">Мотор редуктор 1.1 кВт. WMI 63</option>'+
      '<option value="0,1.1,13483">Мотор редуктор 1.1 кВт. WMI 75</option>'+
      '<option value="0,1.5,12669">Мотор редуктор 1.5 кВт. WMI 63</option>'+
      '<option value="0,1.5,14334">Мотор редуктор 1.5 кВт. WMI 75</option>'+
      '<option value="0,2.2,16869">Мотор редуктор 2.2 кВт. WMI 75</option>'+
      '<option value="0,2.2,18948">Мотор редуктор 2.2 кВт. WMI 90</option>'+
      '<option value="0,3,21098">Мотор редуктор 3 кВт. WMI 90</option>'+
      '<option value="0,3,27090">Мотор редуктор 3 кВт. WMI 110</option>'+
      '<option value="0,4,23051">Мотор редуктор 4 кВт. WMI 90</option>'+
      '<option value="0,4,29043">Мотор редуктор 4 кВт. WMI 110</option>'+
      '<option value="0,5.5,33169">Мотор редуктор 5.5 кВт. WMI 110</option>'+
      '<option value="0,5.5,36666">Мотор редуктор 5.5 кВт. WMI 130</option>'+
      '<option value="0,7.5,39359">Мотор редуктор 7.5 кВт. WMI 110</option>'+
      '<option value="0,7.5,42855">Мотор редуктор 7.5 кВт. WMI 130</option>'+
      '<option value="0,7.5,53987">Мотор редуктор 7.5 кВт. WMI 150</option>'+
      '<option value="0,9.2,47478">Мотор редуктор 9.2 кВт. WMI 130</option>'+
      '<option value="0,9.2,58610">Мотор редуктор 9.2 кВт. WMI 150</option>'+
      '<option value="0,11,61201">Мотор редуктор 11 кВт. WMI 150</option>'+
      '<option value="0,15,76006">Мотор редуктор 15 кВт. WMI 150</option>'
    );
  }
}
function prace_vue() {
  if(chek_chose_radio == false){
    price_sh_transporter = ((params_trans[2]*1)+(params_trans[1]*1)+(params_trans[3]*l_trans*1.1*1.2));
  } else {
    price_sh_transporter = (3000 + (params_trans[1]*1)+(params_trans[3]*l_trans*1.1*1.2));
  }
  if($(".radio_boonker").prop("checked")){
    if(params_trans[0]<160){ price_sh_transporter += 2000 } else { price_sh_transporter += 3000 }
  }
  if($(".radio_pidstavka").prop("checked")){
    if(params_trans[0]<160){ price_sh_transporter += 4000 } else { price_sh_transporter += 5000 }
  }
  if($(".radio_krot").prop("checked")){ price_sh_transporter += (params_trans[3]*0.5) }
  if($(".radio_zholob").prop("checked")){ price_sh_transporter = price_sh_transporter*1.1 }
  if(l_trans >= 10){ price_sh_transporter = price_sh_transporter*1.1 }
  price_sh_transporter = parseInt(price_sh_transporter*1.15);
  price_sh_transporter = parseInt(price_sh_transporter*1.1);
  var priceHtml = ""
    + "<p> Транспортер ₴ " + numberToSpaceString(price_sh_transporter) + ".00 з пдв </p>"
    + "<p> Привід ₴ "  + numberToSpaceString(engine_params[2]*1) + ".00 з пдв </p>"
    + "<hr>"
    + "<p><b> Разом ₴ " + numberToSpaceString(price_sh_transporter + (engine_params[2]*1)) + ".00 з пдв </b></p>";
  $(".price").html(priceHtml);
  renderScrewInfo();
  function numberToSpaceString(n) {
    var s = String(Math.trunc(Number(n)));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
function getParam(n){
  var m = location.search.match(new RegExp('[?&]'+n+'=([^&]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}
function initShnekApi(){
  var id = getParam('shnek_id');
  var row = getParam('row') || '1';
  if (!SHNEK_API) { renderScrewInfo(); return; }
  var url = SHNEK_API + (id ? ('?id='+encodeURIComponent(id)) : ('?row='+encodeURIComponent(row)));
  fetch(url).then(function(r){ return r.json(); }).then(function(j){
    if (j && j.ok && j.data) {
      shnekApiData = j.data;
      renderScrewInfoFromApi(shnekApiData);
    } else {
      renderScrewInfo();
    }
  }).catch(function(){ renderScrewInfo(); });
}
function renderScrewInfoFromApi(d){
  var el = document.getElementById('screw_repair_text');
  if (!el || !d) return;
  var p = d.params || {};
  var g = d.geometry || {};
  var pp = d.pipe || {};
  var w = d.works || {};
  var pr = d.prices || {};
  var tt = d.totals || {};
  function f2(x){ var n = Number(x||0); return n.toLocaleString('uk-UA', {minimumFractionDigits:2, maximumFractionDigits:2}); }
  var title = 'Шнек ' + (p.D||0) + '/' + (p.d||0) + '/' + (p.t||0) + ' S-' + (p.s||0) + 'мм. L-' + (p.L_m||0) + 'м. ціна ' + f2(tt.retail_uah||0) + ' грн з пдв';
  var lines = [];
  lines.push(title);
  lines.push('D = ' + (p.D||0) + ' мм; d = ' + (p.d||0) + ' мм; t = ' + (p.t||0) + ' мм; s = ' + (p.s||0) + ' мм; Lсп. = ' + (p.Lsp_m||0) + ' м; L = ' + (p.L_m||0) + ' м; ρ = ' + (p.rho_g_mm3||0));
  lines.push('l=' + (g.innerPitchLen_mm||0) + 'мм; L=' + (g.outerPitchLen_mm||0) + 'мм; n=' + (g.turnsPerMeter||0) + ' шт/м; Sс=' + (g.surfaceArea_m2||0) + ' м²; Lшт=' + (g.stripLenPerMeter_mm||0) + ' мм/м; m=' + (g.massPerMeter_kg||0) + ' кг/м');
  lines.push('Труба: площа ' + (pp.area_m2||0) + ' м²; маса ' + (pp.mass_kg||0) + ' кг; вартість ' + f2(pp.price_uah||0) + ' грн');
  lines.push('Роботи: демонтаж ' + f2(w.demo_uah||0) + ' грн; монтаж ' + f2(w.mount_uah||0) + ' грн; балансування ' + f2(w.balance_uah||0) + ' грн; грунтування ' + f2(w.prime_uah||0) + ' грн');
  lines.push('Ціна 1 м (роздр): ' + f2(pr.spiral_per_meter_retail_uah||0) + ' грн; 1 м (опт): ' + f2(pr.spiral_per_meter_wholesale_uah||0) + ' грн');
  lines.push('Вартість довжини (роздр): ' + f2(pr.spiral_total_retail_uah||0) + ' грн; (опт): ' + f2(pr.spiral_total_wholesale_uah||0) + ' грн');
  lines.push('Разом (роздр): ' + f2(tt.retail_uah||0) + ' грн; (опт): ' + f2(tt.wholesale_uah||0) + ' грн');
  el.innerHTML = lines.join('<br>');
  renderScrewCostSummary({
    D: p.D||0, d: p.d||0, t: p.t||0, s: p.s||0, L: p.L_m||0, Lsp: p.Lsp_m||0,
    massPerMeter_kg: g.massPerMeter_kg||0,
    pipeMass_kg: pp.mass_kg||0
  });
}
function renderScrewInfo(){
  var spec = deriveScrewSpec();
  var elRepair = document.getElementById('screw_repair_text');
  if (elRepair) {
    var innerPitchLen = Math.sqrt(Math.pow(Math.PI * spec.d, 2) + Math.pow(spec.t, 2));
    var outerPitchLen = Math.sqrt(Math.pow(Math.PI * spec.D, 2) + Math.pow(spec.t, 2));
    var turnsPerMeter = spec.t > 0 ? (1000 / spec.t) : 0;
    var lines = [];
    lines.push('Шнек ' + spec.D + '/' + spec.d + '/' + spec.t + ' S-' + spec.s + 'мм. L-' + spec.L.toFixed(3) + 'м.');
    lines.push('D = ' + spec.D + ' мм; d = ' + spec.d + ' мм; t = ' + spec.t + ' мм; s = ' + spec.s + ' мм; Lсп. = ' + spec.Lsp.toFixed(3) + ' м; L = ' + spec.L.toFixed(3) + ' м');
    lines.push('l=' + innerPitchLen.toFixed(1) + 'мм; L=' + outerPitchLen.toFixed(1) + 'мм; n=' + turnsPerMeter.toFixed(2) + ' шт/м');
    elRepair.innerHTML = lines.join('<br>');
  }
  renderScrewCostSummary({ D: spec.D, d: spec.d, t: spec.t, s: spec.s, L: spec.L, Lsp: spec.Lsp, massPerMeter_kg: 0, pipeMass_kg: 0 });
}
function chooseNearest(arr, val) {
  var best = arr[0], diff = Math.abs(arr[0] - val);
  for (var i = 1; i < arr.length; i++) {
    var d = Math.abs(arr[i] - val);
    if (d < diff) { diff = d; best = arr[i]; }
  }
  return best;
}
function deriveScrewSpec(){
  var pipe = parseFloat(params_trans && params_trans[0]) || 0;
  var Lm = parseFloat(l_trans) || 0;
  var D = Math.max(0, Math.round((pipe - 12)));
  var shaftPool = [35, 42, 57, 76, 89];
  var d = chooseNearest(shaftPool, pipe * 0.35);
  var tRough = Math.round((D * 0.6) / 10) * 10;
  if (tRough < 80) tRough = 80;
  var t = tRough;
  var s = pipe < 130 ? 3 : (pipe < 190 ? 4 : 5);
  var Lsp = Math.max(0, Math.round((Lm * 0.95) * 1000) / 1000);
  return { D: D, d: d, t: t, s: s, L: Lm, Lsp: Lsp };
}
function initScrewMaterials(){
  var spiralSel = document.getElementById('spiral_metal');
  var pipeSel = document.getElementById('pipe_metal');
  if (!spiralSel || !pipeSel) return;
  var spiralOptions = [
    { name: 'Ст3', price: 60 },
    { name: 'S355', price: 70 },
    { name: 'Нержавіюча', price: 120 }
  ];
  var pipeOptions = [
    { name: 'Ст3', price: 90 },
    { name: 'S355', price: 100 },
    { name: 'Нержавіюча', price: 140 }
  ];
  spiralSel.innerHTML = '';
  pipeSel.innerHTML = '';
  spiralOptions.forEach(function(o, i){
    var opt = document.createElement('option');
    opt.value = String(o.price);
    opt.textContent = o.name + ' — ' + o.price + ' грн/кг';
    if (i === 0) opt.selected = true;
    spiralSel.appendChild(opt);
  });
  pipeOptions.forEach(function(o, i){
    var opt = document.createElement('option');
    opt.value = String(o.price);
    opt.textContent = o.name + ' — ' + o.price + ' грн/кг';
    if (i === 0) opt.selected = true;
    pipeSel.appendChild(opt);
  });
  spiralSel.addEventListener('change', function(){ renderScrewInfo(); });
  pipeSel.addEventListener('change', function(){ renderScrewInfo(); });
}
function renderScrewCostSummary(spec){
  var outEl = document.getElementById('screw_total_price');
  if (!outEl) return;
  var spiralPriceKg = parseFloat((document.getElementById('spiral_metal')||{}).value || '0') || 0;
  var pipePriceKg = parseFloat((document.getElementById('pipe_metal')||{}).value || '0') || 0;
  var rho = 0.00786;
  var massPerMeter = spec.massPerMeter_kg && spec.massPerMeter_kg > 0 ? spec.massPerMeter_kg : estimateSpiralMassPerMeter(spec.D, spec.d, spec.t, spec.s, rho);
  var spiralMassTotal = massPerMeter * (spec.Lsp || 0);
  var pipeMassTotal = spec.pipeMass_kg && spec.pipeMass_kg > 0 ? spec.pipeMass_kg : estimatePipeMassTotal(spec, rho);
  var spiralCost = spiralMassTotal * spiralPriceKg;
  var pipeCost = pipeMassTotal * pipePriceKg;
  var total = spiralCost + pipeCost;
  function f2(x){ return Number(x||0).toLocaleString('uk-UA', {minimumFractionDigits:2, maximumFractionDigits:2}); }
  outEl.textContent = 'Вартість шнека: спіраль ' + f2(spiralCost) + ' грн + труба ' + f2(pipeCost) + ' грн = ' + f2(total) + ' грн';
}
function estimateSpiralMassPerMeter(D, d, t, s, rho){
  D = Number(D)||0; d = Number(d)||0; t = Number(t)||1; s = Number(s)||0;
  var R = D/2, r = d/2;
  var rm = (R + r) / 2;
  var Cm = 2 * Math.PI * rm;
  var Lturn = Math.sqrt(Cm*Cm + t*t);
  var w = (R - r);
  var massPerMeterKg = (Lturn * w * s / t) * rho / 1; // see note in code
  return Math.max(0, massPerMeterKg);
}
function estimatePipeMassTotal(spec, rho){
  var pipe = parseFloat(params_trans && params_trans[0]) || 0;
  var Lm = Number(spec.L)||0;
  var wall = guessPipeWall(pipe);
  var Ro = pipe/2;
  var Ri = Math.max(0, Ro - wall);
  var A = Math.PI * (Ro*Ro - Ri*Ri);
  var kgPerM = A * rho / 1;
  return kgPerM * Lm;
}
function guessPipeWall(pipe){
  if (pipe < 130) return 4;
  if (pipe < 190) return 5;
  if (pipe < 260) return 6;
  return 8;
}

