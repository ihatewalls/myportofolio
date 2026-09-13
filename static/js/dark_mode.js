const darkmode = document.getElementById("darkmode");
darkmode.addEventListener("change", function() {
    document.body.classList.toggle("dark-mode", darkmode.checked);
});
