// State management
let lock = false;
let authorList = JSON.parse(localStorage.getItem("authorList")) || [];
let collabList = JSON.parse(localStorage.getItem("collabList")) || [];
let paperList = [];
let pendingRequests = 0;

// ==========================================================================
// UI State Management
// ==========================================================================

function showLoading() {
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyPapersState");
    const papersDiv = document.getElementById("papers");
    
    if (loadingState) loadingState.classList.add("visible");
    if (emptyState) emptyState.classList.remove("visible");
    if (papersDiv) papersDiv.style.display = "none";
}

function hideLoading() {
    const loadingState = document.getElementById("loadingState");
    if (loadingState) loadingState.classList.remove("visible");
}

function showEmptyState() {
    const emptyState = document.getElementById("emptyPapersState");
    const papersDiv = document.getElementById("papers");
    
    if (emptyState) emptyState.classList.add("visible");
    if (papersDiv) papersDiv.style.display = "none";
}

function showPapers() {
    const emptyState = document.getElementById("emptyPapersState");
    const papersDiv = document.getElementById("papers");
    
    if (emptyState) emptyState.classList.remove("visible");
    if (papersDiv) papersDiv.style.display = "flex";
}

function updateSubCount() {
    const badge = document.getElementById("subCount");
    const total = authorList.length + collabList.length;
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? "inline" : "none";
    }
}

function updateEmptySubState() {
    const emptyState = document.getElementById("emptySubState");
    const subList = document.getElementById("subList");
    
    if (authorList.length === 0 && collabList.length === 0) {
        if (emptyState) emptyState.style.display = "block";
        if (subList) subList.style.display = "none";
    } else {
        if (emptyState) emptyState.style.display = "none";
        if (subList) subList.style.display = "block";
    }
}

// ==========================================================================
// Subscriptions List
// ==========================================================================

function listSubs() {
    const subDiv = document.getElementById("subList") || document.getElementById("subscriptions");
    subDiv.innerHTML = "";
    
    const subUl = document.createElement("ul");
    
    // Add authors
    for (let i = 0; i < authorList.length; i++) {
        const subLI = document.createElement("li");
        const suba = document.createElement("a");
        const del = document.createElement("a");
        
        del.innerHTML = "×";
        del.className = "delete";
        del.title = "Remove subscription";
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
        suba.target = "_blank";
        
        subLI.appendChild(suba);
        subLI.appendChild(del);
        subUl.appendChild(subLI);
    }
    
    // Add collaborations
    for (let i = 0; i < collabList.length; i++) {
        const subLI = document.createElement("li");
        const suba = document.createElement("a");
        const del = document.createElement("a");
        
        del.innerHTML = "×";
        del.className = "delete";
        del.title = "Remove subscription";
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
        suba.target = "_blank";
        
        subLI.appendChild(suba);
        subLI.appendChild(del);
        subUl.appendChild(subLI);
    }
    
    subDiv.appendChild(subUl);
    updateSubCount();
    updateEmptySubState();
    searchAll();
}

// Initialize subscriptions list
listSubs();

// ==========================================================================
// Add Author/Collaboration
// ==========================================================================

function addAuthor(author) {
    const id = author["control_number"];
    let notThere = true;
    
    for (let i = 0; i < authorList.length; i++) {
        if (authorList[i]["control_number"] == id) {
            notThere = false;
            break;
        }
    }
    
    if (notThere) {
        authorList.push(author);
        authorList.sort((a, b) => {
            const nameA = a["name"]["preferred_name"];
            const nameB = b["name"]["preferred_name"];
            return nameA.localeCompare(nameB);
        });
        localStorage.setItem("authorList", JSON.stringify(authorList));
        listSubs();
    }
}

function addCollaboration(collab) {
    const id = collab["control_number"];
    let notThere = true;
    
    for (let i = 0; i < collabList.length; i++) {
        if (collabList[i]["control_number"] == id) {
            notThere = false;
            break;
        }
    }
    
    if (notThere) {
        collabList.push(collab);
        collabList.sort((a, b) => {
            const nameA = a["collaboration"]["value"];
            const nameB = b["collaboration"]["value"];
            return nameA.localeCompare(nameB);
        });
        localStorage.setItem("collabList", JSON.stringify(collabList));
        listSubs();
    }
}

// ==========================================================================
// Author Search
// ==========================================================================

function listAuthors(data) {
    const hits = data["hits"]["hits"];
    const authorDiv = document.getElementById("authorRes");
    const authorUl = document.createElement("ul");
    authorDiv.innerHTML = "";

    if (hits.length === 0) {
        const noResults = document.createElement("p");
        noResults.className = "empty-state";
        noResults.textContent = "No authors found. Try a different search term.";
        authorDiv.appendChild(noResults);
        return;
    }

    for (let i = 0; i < hits.length; i++) {
        const meta = hits[i]["metadata"]["name"]["preferred_name"];
        const id = hits[i]["metadata"]["ids"][0]["value"];
        const LI = document.createElement("li");
        const a = document.createElement("a");
        
        a.innerHTML = meta;
        a.style.cursor = "pointer";
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

function listExperiments(data) {
    const hits = data["hits"]["hits"];
    const authorDiv = document.getElementById("authorRes");
    const authorUl = document.createElement("ul");
    authorDiv.innerHTML = "";

    if (hits.length === 0) {
        const noResults = document.createElement("p");
        noResults.className = "empty-state";
        noResults.textContent = "No collaborations found. Try a different search term.";
        authorDiv.appendChild(noResults);
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
        a.style.cursor = "pointer";
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

function searchAuthor() {
    const searchField = document.getElementById("authorSearchField");
    const searchValue = searchField.value.trim();
    
    if (!searchValue) {
        return;
    }
    
    const authorDiv = document.getElementById("authorRes");
    authorDiv.innerHTML = '<p class="empty-state">Searching...</p>';
    
    if (document.getElementById("collab").checked) {
        fetch(`https://inspirehep.net/api/experiments?q=${encodeURIComponent(searchValue)}`)
            .then((response) => response.json())
            .then((json) => listExperiments(json))
            .catch((error) => {
                authorDiv.innerHTML = '<p class="empty-state">Error searching. Please try again.</p>';
            });
    } else {
        fetch(`https://inspirehep.net/api/authors?q=${encodeURIComponent(searchValue)}`)
            .then((response) => response.json())
            .then((json) => listAuthors(json))
            .catch((error) => {
                authorDiv.innerHTML = '<p class="empty-state">Error searching. Please try again.</p>';
            });
    }
}

// Handle Enter key in search field
var input = document.getElementById("authorSearchField");
if (input) {
    input.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchAuthor();
        }
    });
}

// ==========================================================================
// Paper Management
// ==========================================================================

function addPaper(data) {
    let n = 0;
    while (lock) {
        setTimeout(10);
        n++;
        if (n > 10) {
            console.log("Timeout");
            pendingRequests--;
            checkLoadingComplete();
            return;
        }
    }

    lock = true;

    const Today = new Date();
    const Papers = data["hits"]["hits"];
    
    for (let j = 0; j < Papers.length; j++) {
        const id = Papers[j]["id"];
        let dateNew = new Date(Papers[j]["created"]);
        
        // Skip papers older than 3 months
        if (Today.getTime() - dateNew.getTime() > 3 * 2.628e+9) {
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
        return dateB - dateA;
    });

    listPapers(paperList);
    lock = false;
    
    pendingRequests--;
    checkLoadingComplete();
}

function checkLoadingComplete() {
    if (pendingRequests <= 0) {
        hideLoading();
        pendingRequests = 0;
        
        if (paperList.length === 0) {
            if (authorList.length === 0 && collabList.length === 0) {
                showEmptyState();
            }
        }
    }
}

function listPapers(hits) {
    const authorDiv = document.getElementById("papers");
    const authorUl = document.createElement("ul");
    authorDiv.innerHTML = "";

    if (hits.length === 0) {
        return;
    }
    
    showPapers();

    let paperDate = new Date();
    paperDate.setHours(0, 0, 0, 0);

    const Today = document.createElement("h3");
    Today.innerHTML = "Today";
    authorUl.appendChild(Today);
    
    for (let i = 0; i < hits.length; i++) {
        let dateNew = new Date(hits[i]["created"]);
        dateNew.setHours(0, 0, 0, 0);
        
        if (dateNew < paperDate) {
            const DateHeader = document.createElement("h3");
            DateHeader.innerHTML = dateNew.toDateString();
            authorUl.appendChild(DateHeader);
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
        titleA.target = "_blank";
        titleA.innerHTML = title;
        
        if (IsCollab) {
            const authoA = document.createElement("a");
            authoA.className = "sub";
            authoA.innerHTML = Collaboration;
            authoA.href = `https://inspirehep.net/search?p=collaboration%3A%22${Collaboration}%22`;
            authoA.target = "_blank";
            authoP.appendChild(authoA);
        }

        if (meta["author_count"] > 0) {
            const autho = meta["authors"];
            let skip = autho.length > 10;
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
                authoA.target = "_blank";
                authoP.appendChild(authoA);
            });
            
            if (skip) {
                const moreSpan = document.createElement("span");
                moreSpan.className = "more-authors";
                moreSpan.innerHTML = "...and more";
                authoP.appendChild(moreSpan);
            }
        }
        
        LI.appendChild(titleA);
        LI.appendChild(authoP);
        
        const hideAuthor = document.getElementById("showAuthor").checked;
        const hideCollab = document.getElementById("showCollab").checked;
        
        if (IsCollab) {
            LI.className = "collabPapers";
            LI.style.display = hideCollab ? "block" : "none";
        } else {
            LI.className = "authorPapers";
            LI.style.display = hideAuthor ? "block" : "none";
        }
        
        authorUl.appendChild(LI);
    }
    
    authorDiv.appendChild(authorUl);
    
    if (typeof MathJax !== 'undefined' && MathJax.typeset) {
        MathJax.typeset();
    }
}

function checkForSub(author) {
    return authorList.some((ele) => ele["control_number"] == author["recid"]);
}

// ==========================================================================
// Paper Search
// ==========================================================================

function searchPaper(author) {
    const authorIds = author["ids"];
    let authorId;
    
    authorIds.forEach((ele) => {
        if (ele["schema"] == "INSPIRE BAI") {
            authorId = ele["value"];
        }
    });
    
    if (authorId == undefined) {
        console.log("Couldn't find id for", author["ids"]);
        pendingRequests--;
        checkLoadingComplete();
        return;
    }
    
    fetch(`https://inspirehep.net/api/literature?sort=mostrecent&size=5&page=1&q=author%3A${authorId}`)
        .then((response) => response.json())
        .then((json) => addPaper(json))
        .catch((error) => {
            console.error("Error fetching papers:", error);
            pendingRequests--;
            checkLoadingComplete();
        });
}

function searchPaperCollab(collab) {
    fetch(`https://inspirehep.net/api/literature?sort=mostrecent&size=5&page=1&q=collaboration%3A${collab["collaboration"]["value"]}`)
        .then((response) => response.json())
        .then((json) => addPaper(json))
        .catch((error) => {
            console.error("Error fetching papers:", error);
            pendingRequests--;
            checkLoadingComplete();
        });
}

function searchAll() {
    const totalSubs = authorList.length + collabList.length;
    
    if (totalSubs === 0) {
        showEmptyState();
        return;
    }
    
    showLoading();
    pendingRequests = totalSubs;
    
    authorList.forEach((ele) => {
        searchPaper(ele);
    });
    
    collabList.forEach((ele) => {
        searchPaperCollab(ele);
    });

    hideAuthor(document.getElementById("showAuthor"));
    hideCollab(document.getElementById("showCollab"));
}

// Initial search
searchAll();

// ==========================================================================
// Import/Export
// ==========================================================================

function exportAuthorList(element) {
    let isCollab = document.getElementById("collab").checked;
    let data = isCollab ? collabList : authorList;
    let filename = isCollab ? "collaborations.json" : "authors.json";
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importAuthorList(element) {
    let files = document.getElementById('selectFiles').files;
    
    if (files.length <= 0) {
        return false;
    }

    let fr = new FileReader();

    fr.onload = function(e) {
        try {
            let result = JSON.parse(e.target.result);
            let isCollab = document.getElementById("collab").checked;
            
            if (isCollab) {
                collabList = result;
                localStorage.setItem("collabList", JSON.stringify(collabList));
            } else {
                authorList = result;
                localStorage.setItem("authorList", JSON.stringify(authorList));
            }
            
            listSubs();
        } catch (error) {
            console.error("Error parsing JSON:", error);
            alert("Error importing file. Please make sure it's a valid JSON file.");
        }
    };

    fr.readAsText(files.item(0));
}

// ==========================================================================
// UI Toggle Functions
// ==========================================================================

function showSubs(el) {
    let subDiv = document.getElementById("subscriptions");
    let icon = el.querySelector('.icon');
    
    if (subDiv.style.display === "block") {
        subDiv.style.display = "none";
        el.classList.remove("down");
        el.classList.add("up");
        if (icon) icon.textContent = "▶";
    } else {
        subDiv.style.display = "block";
        el.classList.remove("up");
        el.classList.add("down");
        if (icon) icon.textContent = "▼";
    }
}

function showSearch(el) {
    let subDiv = document.getElementById("authorSearch");
    let icon = el.querySelector('.icon');
    
    if (subDiv.style.display === "block") {
        subDiv.style.display = "none";
        el.classList.remove("down");
        el.classList.add("up");
        if (icon) icon.textContent = "▶";
    } else {
        subDiv.style.display = "block";
        el.classList.remove("up");
        el.classList.add("down");
        if (icon) icon.textContent = "▼";
    }
}

function hideAuthor(el) {
    let ShowAuthor = el.checked;
    const authorPapers = document.getElementsByClassName("authorPapers");
    
    for (let i = 0; i < authorPapers.length; i++) {
        authorPapers[i].style.display = ShowAuthor ? "block" : "none";
    }
}

function hideCollab(el) {
    let ShowCollab = el.checked;
    const collabPapers = document.getElementsByClassName("collabPapers");
    
    for (let i = 0; i < collabPapers.length; i++) {
        collabPapers[i].style.display = ShowCollab ? "block" : "none";
    }
}
