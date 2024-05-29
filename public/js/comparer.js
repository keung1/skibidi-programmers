
var hp1 = document.getElementById("hp1");
let a1 = document.getElementById("attack1");
let d1 = document.getElementById("defense1");
let spa1 = document.getElementById("speciala1");
let spd1 = document.getElementById("speciald1");
let speed1 = document.getElementById("speed1");

var hp2 = document.getElementById("hp2").getElementsByTagName("li");
let a2 = document.getElementById("attack2");
let d2 = document.getElementById("defense2");
let spa2 = document.getElementById("speciala2");
let spd2 = document.getElementById("speciald2");
let speed2 = document.getElementById("speed2");

function compare(){
    if(parseInt(hp1) > parseInt(hp2)){
        hp1.setAttribute("class", "more");
        hp2.setAttribute("class", "less");
    }
    else if(parseInt(poke1[i].innerHTML)< parseInt(poke2[i].innerHTML)){
        poke1.style.backgroundColor = "red";
        poke2.style.backgroundColor = "green"
    }
    else{
        poke1.style.backgroundColor = "grey";
        poke2.style.backgroundColor = "grey"
    }

}