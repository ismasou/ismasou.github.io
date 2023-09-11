// localStorage.setItem("authorList",
//     JSON.stringify([]))

let lock = false;

let authorList = JSON.parse(localStorage.getItem("authorList"));

if (authorList == null) {
    authorList = [];
}
let paperList = [];

function listSubs() {
    const subDiv = document.getElementById("subscriptions");
    subDiv.innerHTML = "";
    const subUl = document.createElement("ul");
    for (let i = 0; i < authorList.length; i++) {
        const subLI = document.createElement("li");
        const suba = document.createElement("a");
        suba.innerHTML = authorList[i]["name"]["preferred_name"];
        suba.href = `https://inspirehep.net/authors/${authorList[i]["control_number"]}`;
        subLI.appendChild(suba);
        subUl.appendChild(subLI);
    }
    subDiv.appendChild(subUl);
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
    const authorName = document.getElementById("authorSearch").value;
    let data;
    const response = fetch(`https://inspirehep.net/api/authors?q=${authorName}`)
        .then((response) => response.json())
        .then((json) => listAuthors(json));
    return data;
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

    let paperDate = new Date();
    paperDate.setHours(0, 0, 0, 0);

    const Today = document.createElement("h3");
    Today.innerHTML = "Today";
    authorDiv.appendChild(Today);

    for (let i = 0; i < hits.length; i++) {
        // console.log(hits[i]);
        let dateNew = new Date(hits[i]["created"]);
        dateNew.setHours(0, 0, 0, 0);
        if (dateNew < paperDate) {
            const Today = document.createElement("h3");
            Today.innerHTML = dateNew.toDateString();
            authorUl.appendChild(Today);
            paperDate = dateNew;
        }

        const meta = hits[i]["metadata"];
        const title = meta["titles"][0]["title"];
        const autho = meta["authors"];
        // const id = hits[i]["metadata"]["ids"][0]["value"];
        const LI = document.createElement("li");
        const authoP = document.createElement("p");
        authoP.className = "authors";
        const titleA = document.createElement("a");
        titleA.className = "papertitle";
        const id = hits[i]["id"];
        titleA.href = `https://inspirehep.net/literature/${id}`;
        titleA.innerHTML = title;
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
        LI.appendChild(titleA);
        LI.appendChild(authoP);
        authorUl.appendChild(LI);
    }
    authorDiv.appendChild(authorUl);
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

function searchAll() {
    authorList.forEach((ele) => {
        searchPaper(ele);
    });
}

searchAll();


function exportAuthorList(element){
    let authors = JSON.stringify(authorList, null, 2);
    // download
    location.href = 'data:application/octet-stream,' + encodeURIComponent(authors);
    // element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(authors));
    // element.setAttribute('download', 'authors.json');
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
        searchAll();

    }

    fr.readAsText(files.item(0));

}
