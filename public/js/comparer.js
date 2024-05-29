
let poke1 = document.getElementsByClassName("classname");

let poke2 = document.getElementsByClassName("clas");


for(let i = 0; i < 6; i++){

    if(parseInt(poke1[i].innerHTML)> parseInt(poke2[i].innerHTML)){
        poke1.Style.backgroundColor = "green";
        poke2.style.backgroundColor = "red"
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