
function displayContent() {
    $(".product-container").empty();
    const dd = document.getElementById('dd').value;
    const result = filterByDd(dd);
    const productContainer = document.querySelector('.product-container');
    const option1 = document.getElementById('option1');

    // Define spiral_calculation function before it's used
    function spiral_calculation(data) {
    let length_inner_line = function(sp_d, sp_p) { 
        return Math.sqrt(Math.pow(Math.PI * sp_d, 2) + Math.pow(sp_p, 2));
    };
    
    let hight_shtrips = function(sp_dd, sp_d) {
        return (sp_dd - sp_d) / 2;
    };
    
    let count_segment_on_m = function(sp_p) {
        return 1000 / sp_p;
    };
    
    let leangrth_shtrp_on_m = function(length_inner_line, count_segment_on_m) {
        return length_inner_line * count_segment_on_m * 1.3;
    };
    
    let mass_m_spirall = function(sp_s, hight_shtrips, leangrth_shtrp_on_m ) {
        return (sp_s * hight_shtrips * leangrth_shtrp_on_m  * 0.00786) / 1000;
    };
    
    let price_rozdr = function(mass_m_spirall) {
        return Math.round((mass_m_spirall * 1.1 * 55 * 6 * 1,1) / 3) * 3;
    };
    
    let price_opt = function(mass_m_spirall) {
        return Math.round((mass_m_spirall * 1.1 * 55 * 5 * 1,1) / 3) * 3;
    };

    let resultArray = []; // Corrected typo

    data.forEach((item, index) => {
        let sp_dd = item.dd;  //F12
        let sp_d = item.d;   //G12
        let sp_p = item.p;   //H12
        let sp_s = item.s;   //I12
        
        resultArray.push( {
            length_inner_line: length_inner_line(sp_d, sp_p),
            hight_shtrips: hight_shtrips(sp_dd, sp_d),
            count_segment_on_m: count_segment_on_m(sp_p),
            leangrth_shtrp_on_m: leangrth_shtrp_on_m(length_inner_line(sp_d, sp_p), count_segment_on_m(sp_p)),
            mass_m_spirall: mass_m_spirall(sp_s, hight_shtrips(sp_dd, sp_d), leangrth_shtrp_on_m(length_inner_line(sp_d, sp_p), count_segment_on_m(sp_p))),
            price_rozdr: price_rozdr(mass_m_spirall(sp_s, hight_shtrips(sp_dd, sp_d), leangrth_shtrp_on_m(length_inner_line(sp_d, sp_p), count_segment_on_m(sp_p)))),
            price_opt: price_opt(mass_m_spirall(sp_s, hight_shtrips(sp_dd, sp_d), leangrth_shtrp_on_m(length_inner_line(sp_d, sp_p), count_segment_on_m(sp_p))))
        });
        
    });

  
    return resultArray; // Return the resultArray
  }


    let spiral_paramm = spiral_calculation(result);

    if (!option1.checked) {
        result.forEach((item, index) => {
            const productBlock = document.createElement('div');
            productBlock.classList.add('product-block');
            productBlock.innerHTML =
                `<h4>${item.dd}/${item.d}/${item.p}/${item.l_r === "Права" ? "R" : "L"} S-${item.s}мм.</h4>
                <p>${roundToDecimal(item.saldo_m)}.м</p>
                <p>${spiral_paramm[index].price_rozdr}</p>
                <p>${spiral_paramm[index].price_opt}</p>`;
            productContainer.appendChild(productBlock);
        });
    } else {
        const productBlock = document.createElement('div');
        productBlock.classList.add('product-block');
        productBlock.innerHTML =
            `<div class="table-responsive">
                <table class="table" id="table_resault">
                    <thead>
                        <tr>
                            <th>Парам</th>
                            <th>Залиш</th>
                            <th>Роздр</th>
                            <th>Опт</th>
                        </tr>
                    </thead>
                    <tbody class="table_resault">
                        
                    </tbody>
                </table>
            </div>`;
        productContainer.appendChild(productBlock);
        const resultDiv = productBlock.querySelector('.table_resault');

        result.forEach((item, index) => { // Added index parameter
            const itemRow = document.createElement('tr');
            itemRow.innerHTML =
                `<td>
                    ${item.dd}/${item.d}/${item.p}/${item.l_r === "Права" ? "R" : "L"} S-${item.s}мм.
                </td>
                <td>
                    ${roundToDecimal(item.saldo_m)}.м
                </td>

                <td>${spiral_paramm[index].price_rozdr}</td>
                <td>${spiral_paramm[index].price_opt}</td>`;
            resultDiv.appendChild(itemRow);
        });
    }
}

