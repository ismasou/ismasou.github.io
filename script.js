// localStorage.setItem("authorList",
//     JSON.stringify([]))


let lock = false;

let authorList = JSON.parse(localStorage.getItem("authorList"));
let collabList = JSON.parse(localStorage.getItem("collabList"));

if (authorList == null) {
    authorList = [];
}
if (collabList == null) {
    collabList = [];
}

let paperList = [];

function listSubs() {
    const subDiv = document.getElementById("subscriptions");
    subDiv.innerHTML = "";
    const subUl = document.createElement("ul");
    for (let i = 0; i < authorList.length; i++) {
        const subLI = document.createElement("li");
        const suba = document.createElement("a");
        const del = document.createElement("a");
        del.innerHTML = "X";
        del.className = "delete";
        del.onclick = function () {
            authorList = authorList.filter((ele) => {
                return ele["control_number"] != authorList[i]["control_number"];
            });
            localStorage.setItem("authorList", JSON.stringify(authorList));
            paperList = [];
            listSubs();
        };
        suba.innerHTML = authorList[i]["name"]["preferred_name"];
        suba.href = `https://inspirehep.net/authors/${authorList[i]["control_number"]}`;
        subLI.appendChild(suba);
        subLI.innerHTML += "   |   ";
        subLI.appendChild(del);
        subUl.appendChild(subLI);
    }
    for (let i = 0; i < collabList.length; i++) {
        const subLI = document.createElement("li");
        const suba = document.createElement("a");
        const del = document.createElement("a");
        del.innerHTML = "X";
        del.className = "delete";
        del.onclick = function () {
            collabList = collabList.filter((ele) => {
                return ele["control_number"] != collabList[i]["control_number"];
            });
            localStorage.setItem("collabList", JSON.stringify(collabList));
            paperList = [];
            listSubs();
        };
        suba.innerHTML = collabList[i]["collaboration"]["value"];
        suba.href = `https://inspirehep.net/search?p=collaboration%3A${collabList[i]["collaboration"]["value"]}`;
        subLI.appendChild(suba);
        subLI.innerHTML += "   |   ";
        subLI.appendChild(del);
        subUl.appendChild(subLI);
    }
    subDiv.appendChild(subUl);

    searchAll();
}

listSubs();

function addAuthor(author) {
    // console.log(author);
    const id = author["control_number"];
    let notThere = true;
    for (let i = 0; i < authorList.length; i++) {
        const id1 = authorList[i]["control_number"];
        if (id1 == id) {
            notThere = false;
            break;
        }
    }
    if (notThere) {
        authorList.push(author);
    }
    // console.log(authorList);
    authorList.sort((a, b) => {
        const nameA = a["name"]["preferred_name"];
        const nameB = b["name"]["preferred_name"];
        if (nameA > nameB) {
            return 1;
        } else if (nameA == nameB) {
            return 0;
        } else {
            return -1;
        }
    });
    localStorage.setItem("authorList", JSON.stringify(authorList));
    listSubs();
}

function addCollaboration(collab) {

    const id = collab["control_number"];
    console.log(collabList);
    let notThere = true;
    for (let i = 0; i < collabList.length; i++) {
        const id1 = collabList[i]["control_number"];
        if (id1 == id) {
            notThere = false;
            break;
        }
    }
    if (notThere) {
        collabList.push(collab);
    }

    collabList.sort((a, b) => {
        const nameA = a["collaboration"]["value"];
        const nameB = b["collaboration"]["value"];
        if (nameA > nameB) {
            return 1;
        } else if (nameA == nameB) {
            return 0;
        } else {
            return -1;
        }
    });
    localStorage.setItem("collabList", JSON.stringify(collabList));
    listSubs();
}

function searchUrl(authorId) {
    return `https://inspirehep.net/api/{literature}?{q=author:${authorId}}`;
}

function listAuthors(data) {
    const hits = data["hits"]["hits"];
    const authorDiv = document.getElementById("authorRes");
    const authorUl = document.createElement("ul");
    authorDiv.innerHTML = "";

    for (let i = 0; i < hits.length; i++) {
        // console.log(hits[i]);
        const meta = hits[i]["metadata"]["name"]["preferred_name"];
        const id = hits[i]["metadata"]["ids"][0]["value"];
        const LI = document.createElement("li");
        const a = document.createElement("a");
        a.innerHTML = meta;
        LI.id = id;
        LI.className = "author";
        a.onclick = function () {
            addAuthor(hits[i]["metadata"]);
        };
        LI.appendChild(a);
        authorUl.appendChild(LI);
    }
    authorDiv.appendChild(authorUl);
}

function searchAuthor() {
    if (document.getElementById("collab").checked) {
        const experimentName = document.getElementById("authorSearchField").value;
        console.log(experimentName);
        const response = fetch(`https://inspirehep.net/api/experiments?q=${experimentName}`)
            .then((response) => response.json())
            .then((json) => listExperiments(json));
    } else {
        const authorName = document.getElementById("authorSearchField").value;
        const response = fetch(`https://inspirehep.net/api/authors?q=${authorName}`)
            .then((response) => response.json())
            .then((json) => listAuthors(json));
    }
    return ;
}

function listExperiments(data) {
    const hits = data["hits"]["hits"];
    const authorDiv = document.getElementById("authorRes");
    const authorUl = document.createElement("ul");
    authorDiv.innerHTML = "";

    console.log(hits.length);
    if (hits.length == 0) {
        const LI = document.createElement("li");
        LI.innerHTML = "No Results";
        authorUl.appendChild(LI);
        authorDiv.appendChild(authorUl);
        return;
    }

    for (let i = 0; i < hits.length; i++) {
        if (hits[i]["metadata"]["collaboration"] == undefined) {
            continue;
        }
        const meta = hits[i]["metadata"]["collaboration"]["value"];
        const id = hits[i]["metadata"]["control_number"];
        const LI = document.createElement("li");
        const a = document.createElement("a");
        a.innerHTML = meta;
        LI.id = id;
        LI.className = "author";
        a.onclick = function () {
            addCollaboration(hits[i]["metadata"]);
        };
        LI.appendChild(a);
        authorUl.appendChild(LI);
    }
    authorDiv.appendChild(authorUl);
}

// Get the input field
var input = document.getElementById("authorSearch");

// Execute a function when the user presses a key on the keyboard
input.addEventListener("keypress", function (event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        searchAuthor();
    }
});

function addPaper(data) {

    let n = 0;
    while (lock) {
        setTimeout(10);
        n++;
        if (n > 10) {
            console.log("Timeout");
            return;
        }
    }

    lock = true;

    const Today = new Date();

    const Papers = data["hits"]["hits"];
    // console.log(Papers);
    for (let j = 0; j < Papers.length; j++) {
        const id = Papers[j]["id"];

        let dateNew = new Date(Papers[j]["created"]);
        // console.log(Today.getTime() - dateNew.getTime() > 2.628e+9);
        if (Today.getTime() - dateNew.getTime() > 3*2.628e+9) {
            continue;
        }
        let notThere = true;
        for (let i = 0; i < paperList.length; i++) {
            if (paperList[i]["id"] == id) {
                notThere = false;
                break;
            }
        }
        if (notThere) {
            paperList.push(Papers[j]);
        }
    }

    paperList.sort((a, b) => {
        const dateA = new Date(a["created"]);
        const dateB = new Date(b["created"]);
        if (dateA > dateB) {
            return -1;
        } else if (dateA == dateB) {
            return 0;
        } else {
            return 1;
        }
    })

    listPapers(paperList);

    lock = false;
}

function listPapers(hits) {
    console.log(hits);
    const authorDiv = document.getElementById("papers");
    const authorUl = document.createElement("ul");
    authorDiv.innerHTML = "";
    authorUl.style = "display: grid;";

    let paperDate = new Date();
    paperDate.setHours(0, 0, 0, 0);

    const Today = document.createElement("h3");
    Today.innerHTML = "Today";
    Today.style = "grid-column-start: 1; grid-column-end: 3;";
    authorUl.appendChild(Today);
    authorUl.appendChild(document.createElement("br"));
    
    for (let i = 0; i < hits.length; i++) {
        // console.log(hits[i]);
        let dateNew = new Date(hits[i]["created"]);
        dateNew.setHours(0, 0, 0, 0);
        if (dateNew < paperDate) {
            const Today = document.createElement("h3");
            Today.innerHTML = dateNew.toDateString();
            Today.style = "grid-column-start: 1; grid-column-end: 3;";
            authorUl.appendChild(Today);
            authorUl.appendChild(document.createElement("br"));
            paperDate = dateNew;
        }

        // Check Collaboration
        let IsCollab = false;
        let Collaboration = "";
        if (hits[i]["metadata"]["accelerator_experiments"] != undefined) {
            IsCollab = true;
            Collaboration = hits[i]["metadata"]["accelerator_experiments"][0]["legacy_name"];
        }

        const meta = hits[i]["metadata"];
        const title = meta["titles"][0]["title"];
        const LI = document.createElement("li");
        const authoP = document.createElement("p");
        authoP.className = "authors";
        const titleA = document.createElement("a");
        titleA.className = "papertitle";
        const id = hits[i]["id"];
        titleA.href = `https://inspirehep.net/literature/${id}`;
        titleA.innerHTML = title;
        if (IsCollab) {
            const authoA = document.createElement("a");
            authoA.className = "sub";
            authoA.innerHTML = Collaboration;
            authoA.href = `https://inspirehep.net/search?p=collaboration%3A%22${Collaboration}%22`;
            authoP.appendChild(authoA);
            authoP.innerHTML += "   |   ";
        }

        if(meta["author_count"] > 0){
            const autho = meta["authors"];
            // const id = hits[i]["metadata"]["ids"][0]["value"];
            let skip = false;
            if (autho.length > 10) {
                skip = true;
            }
            let ni = 0;
            autho.forEach((element) => {
                let IsSub = checkForSub(element);
                if (skip && !IsSub && ni > 10) {
                    return;
                }
                ni++;
                const authoA = document.createElement("a");
                if (IsSub) {
                    authoA.className = "sub";
                }
                authoA.innerHTML = element["full_name"];
                authoA.href = `https://inspirehep.net/authors/${element["recid"]}`;
                authoP.appendChild(authoA);
                authoP.innerHTML += "   |   ";
            });
            if(skip){
                authoP.innerHTML += "More...";
            }
        }
        LI.appendChild(titleA);
        LI.appendChild(authoP);
        const hideAuthor = document.getElementById("showAuthor").checked;
        const hideCollab = document.getElementById("showCollab").checked;
        if(IsCollab){
            LI.style = "grid-column: 2;"
            LI.className = "collabPapers";
            LI.style.display = hideCollab ? "block" : "none";
        } else {
            LI.style = "grid-column: 1;"
            LI.className = "authorPapers";
            LI.style.display = hideAuthor ? "block" : "none";
        }
        authorUl.appendChild(LI);
    }
    authorDiv.appendChild(authorUl);
    if (MathJax != undefined) {
        MathJax.typeset();
    }
}

function checkForSub(author) {
    let IsSub = false;
    authorList.forEach((ele) => {
        if (ele["control_number"] == author["recid"]) {
            IsSub = true;
        }
    });
    return IsSub;
}

function searchPaper(author) {
    const authorIds = author["ids"];
    let authorId;
    authorIds.forEach((ele) => {
        if (ele["schema"] == "INSPIRE BAI") {
            authorId = ele["value"];
        }
    });
    if (authorId == undefined) {
        console.log("Couldn't find id for");
        console.log(author["ids"]);
        return;
    }
    const authorName = document.getElementById("authorSearch").value;
    const response = fetch(
        `https://inspirehep.net/api/literature?sort=mostrecent&size=5&page=1&q=author%3A${authorId}`
    )
        .then((response) => response.json())
        .then((json) => addPaper(json));
}

function searchPaperCollab(collab) {
    const response = fetch(
        `https://inspirehep.net/api/literature?sort=mostrecent&size=5&page=1&q=collaboration%3A${collab["collaboration"]["value"]}`
    )
        .then((response) => response.json())
        .then((json) => addPaper(json));
}

function searchAll() {
    authorList.forEach((ele) => {
        searchPaper(ele);
    });
    collabList.forEach((ele) => {
        searchPaperCollab(ele);
    });

    hideAuthor(document.getElementById("showAuthor"));
    hideCollab(document.getElementById("showCollab"));

}

searchAll();

function exportAuthorList(element){
    let isCollab = document.getElementById("collab").checked;
    if (isCollab) {
        let collab= JSON.stringify(collabList, null, 2);
        // download
        location.href = 'data:application/octet-stream,' + encodeURIComponent(collab);
    } else {
    let authors = JSON.stringify(authorList, null, 2);
    // download
    location.href = 'data:application/octet-stream,' + encodeURIComponent(authors);
    // element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(authors));
    // element.setAttribute('download', 'authors.json');
    }
}

function importAuthorList(element){
    let files = document.getElementById('selectFiles').files;
    // console.log(files);
    if (files.length <= 0) {
        return false;
    }

    let fr = new FileReader();

    fr.onload = function(e) {
        console.log(e);
        let result = JSON.parse(e.target.result);
        console.log(result);
        authorList = result;
        localStorage.setItem("authorList", JSON.stringify(authorList));
        listSubs();
    }

    fr.readAsText(files.item(0));

}

function showSubs(el){

    let subDiv = document.getElementById("subscriptions");
    if(subDiv.style.display == "block"){
        subDiv.style.display = "none";
        el.className = "up";
        return;
    }
    el.className = "down";
    subDiv.style.display = "block";
}

function showSearch(el){

    let subDiv = document.getElementById("authorSearch");
    if(subDiv.style.display == "block"){
        subDiv.style.display = "none";
        el.className = "up";
        return;
    }
    el.className = "down";
    subDiv.style.display = "block";
}


function hideAuthor(el){
    let ShowAuthor = el.checked;
    const authorPapers = document.getElementsByClassName("authorPapers");
    for (let i = 0; i < authorPapers.length; i++) {
        const element = authorPapers[i];
        element.style.display = ShowAuthor ? "block" : "none";
    }
}

function hideCollab(el){
    let ShowCollab = el.checked;
    const collabPapers = document.getElementsByClassName("collabPapers");
    for (let i = 0; i < collabPapers.length; i++) {
        const element = collabPapers[i];
        element.style.display = ShowCollab ? "block" : "none";
    }
}
