const darkmode = document.getElementById("darkmode");
darkmode.addEventListener("change", function() {
    document.body.classList.toggle("dark-mode", darkmode.checked);
    if (document.body.classList.contains("dark-mode")){
        localStorage.setItem("theme", "dark")
    }else{
        localStorage.setItem("theme", "light")
    }
});
if(localStorage.getItem("theme")==="dark"){
    darkmode.checked = true
    document.body.classList.toggle("dark-mode", darkmode.checked);
}