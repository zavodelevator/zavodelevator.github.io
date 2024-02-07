  
  function filterByDd(dd) {//фільтрація
    let a = JSON.parse(localStorage.getItem('sclad_sp_json')) || [];
    let b = customSort(a);
    let c = filterAndMapArray(b);
    
    if (dd === "") {
      return c.slice(1);
    }

    if (dd[0] === "*" && dd.includes("-")) {
      let ddd = dd.slice(1);
      let tamp = [];
      let range_arrey = ddd.split("-").map(Number);
      
      for (let i = range_arrey[0]; i <= range_arrey[1]; i++) {
        
        let res_fil = c.filter((item) => item.d == i);
        tamp = tamp.concat(res_fil);
      }
      return tamp;
    }
    
    if (dd[0] === "*") {
      let ddd = dd.slice(1);
      let res_fil = c.filter((item) => item.d == ddd);       
      return res_fil;
    }
  
    if (dd.includes("-")) {
      let tamp = [];
      let range_arrey = dd.split("-").map(Number);
        
      for (let i = range_arrey[0]; i <= range_arrey[1]; i++) {
        let res_fil = c.filter((item) => item.dd == i);
        tamp = tamp.concat(res_fil);
      }
      return tamp;
    }
  
    return c.filter((item) => item.dd === dd);
  }
  