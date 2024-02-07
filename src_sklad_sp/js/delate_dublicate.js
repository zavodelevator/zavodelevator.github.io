
function filterAndMapArray(inputArray) {//видалення та сумування дублікатів
    // Сортуємо масив за параметром "dd"
    inputArray.sort((a, b) => a.dd - b.dd);
    
    // Створюємо новий масив для результатів
    let resultArray = [];
    
    // Обхід по вхідному масиву
    for (let i = 0; i < inputArray.length; i++) {
        let currentElement = inputArray[i];
        let found = false;
        
        // Пошук елемента в результативному масиві
        for (let j = 0; j < resultArray.length; j++) {
            let resultElement = resultArray[j];
            
            // Перевірка на співпадіння параметрів
            if (currentElement.dd === resultElement.dd &&
                currentElement.d === resultElement.d &&
                currentElement.p === resultElement.p &&
                currentElement.s === resultElement.s &&
                currentElement.l_r === resultElement.l_r) {
                
                // Якщо знайдено співпадіння, додаємо "saldo_m" та виходимо з циклу
                resultElement.saldo_m = parseInt(resultElement.saldo_m) + parseInt(currentElement.saldo_m);
                found = true;
                break;
            }
        }
        
        // Якщо співпадіння не знайдено, додаємо елемент в результативний масив
        if (!found) {
            resultArray.push({
                dd: currentElement.dd,
                d: currentElement.d,
                p: currentElement.p,
                s: currentElement.s,
                saldo_m: currentElement.saldo_m,
                l_r: currentElement.l_r
            });
        }
    }
    
    return resultArray;
}
