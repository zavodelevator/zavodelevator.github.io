

// силка на отримання даних з таблиці https://script.google.com/macros/s/AKfycbz_KMcNXy5f_LuvnduJS3P_IgM1z0Jukn8P78JmGSGAal8qennLE0WJKCEziNQL8UPE/exec
const NKZ_ENDPOINT = "https://script.google.com/macros/s/AKfycbz_KMcNXy5f_LuvnduJS3P_IgM1z0Jukn8P78JmGSGAal8qennLE0WJKCEziNQL8UPE/exec";

(function () {
  const controller = new AbortController();
  const timeout = setTimeout(function () {
    controller.abort();
  }, 15000);

  fetch(NKZ_ENDPOINT, { method: "GET", signal: controller.signal, mode: "cors" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      console.log("NKZ data:", data);
      window.nkzData = data;
    })
    .catch(function (err) {
      console.log("NKZ fetch error:", err);
    })
    .finally(function () {
      clearTimeout(timeout);
    });
})();
