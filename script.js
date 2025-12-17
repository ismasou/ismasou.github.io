// State management
let authorList = JSON.parse(localStorage.getItem("authorList")) || [];
let collabList = JSON.parse(localStorage.getItem("collabList")) || [];
let readingList = JSON.parse(localStorage.getItem("readingList")) || [];
let paperList = [];
let pendingRequests = 0;
let currentReadingFilter = 'all';

// Date-based fetching state
let currentWeeksBack = 4; // Start with 1 month (4 weeks)
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getDateRange() {
    const now = new Date();
    const startDate = new Date(now.getTime() - (currentWeeksBack * WEEK_MS));
    // Format as YYYY-MM-DD for INSPIRE API
    const formatDate = (d) => d.toISOString().split('T')[0];
    return {
        start: formatDate(startDate),
        end: formatDate(now)
    };
}

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

function updatePaperCounts(authorCount, collabCount) {
    const authorCountEl = document.getElementById("authorPaperCount");
    const collabCountEl = document.getElementById("collabPaperCount");
    
    if (authorCountEl) {
        authorCountEl.textContent = `(${authorCount})`;
    }
    if (collabCountEl) {
        collabCountEl.textContent = `(${collabCount})`;
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
            currentWeeksBack = 4; // Reset to 1 month
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
            currentWeeksBack = 4; // Reset to 1 month
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

function addPaper(data, isFromCollab = false, collabName = "") {
    const Today = new Date();
    const Papers = data["hits"]["hits"];
    
    for (let j = 0; j < Papers.length; j++) {
        const id = Papers[j]["id"];
        let dateNew = new Date(Papers[j]["created"]);
        
        // Skip papers older than 3 months
        if (Today.getTime() - dateNew.getTime() > 3 * 2.628e+9) {
            continue;
        }
        
        let existingIndex = paperList.findIndex(p => p["id"] == id);
        
        if (existingIndex === -1) {
            // New paper - add with collab info if from collab search
            const paperEntry = { ...Papers[j] };
            if (isFromCollab) {
                paperEntry._isFromCollab = true;
                paperEntry._collabName = collabName;
            }
            paperList.push(paperEntry);
        } else if (isFromCollab && !paperList[existingIndex]._isFromCollab) {
            // Paper exists but mark it as also from collab
            paperList[existingIndex]._isFromCollab = true;
            paperList[existingIndex]._collabName = collabName;
        }
    }

    paperList.sort((a, b) => {
        const dateA = new Date(a["created"]);
        const dateB = new Date(b["created"]);
        return dateB - dateA;
    });

    listPapers(paperList);
    
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
                hideLoadMore();
            }
        } else {
            showLoadMore();
            updateDateRangeInfo();
        }
    }
}

function listPapers(hits) {
    const papersContainer = document.getElementById("papers");
    papersContainer.innerHTML = "";

    if (hits.length === 0) {
        updatePaperCounts(0, 0);
        return;
    }
    
    showPapers();

    // Group papers by date
    const papersByDate = {};
    let totalAuthorPapers = 0;
    let totalCollabPapers = 0;
    
    hits.forEach(paper => {
        const dateObj = new Date(paper["created"]);
        dateObj.setHours(0, 0, 0, 0);
        const dateKey = dateObj.toISOString().split('T')[0];
        
        if (!papersByDate[dateKey]) {
            papersByDate[dateKey] = {
                date: dateObj,
                authorPapers: [],
                collabPapers: []
            };
        }
        
        // Check if collaboration paper
        let isCollab = false;
        let collabName = "";
        
        if (paper._isFromCollab) {
            isCollab = true;
            collabName = paper._collabName;
        } else if (paper["metadata"]["accelerator_experiments"] != undefined) {
            isCollab = true;
            collabName = paper["metadata"]["accelerator_experiments"][0]["legacy_name"];
        }
        
        // Store collab info on the paper for rendering
        paper._displayCollab = isCollab;
        paper._displayCollabName = collabName;
        
        if (isCollab) {
            papersByDate[dateKey].collabPapers.push(paper);
            totalCollabPapers++;
        } else {
            papersByDate[dateKey].authorPapers.push(paper);
            totalAuthorPapers++;
        }
    });
    
    // Update paper counts in headers
    updatePaperCounts(totalAuthorPapers, totalCollabPapers);
    
    // Sort dates descending
    const sortedDates = Object.keys(papersByDate).sort((a, b) => new Date(b) - new Date(a));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hideAuthorChecked = document.getElementById("showAuthor").checked;
    const hideCollabChecked = document.getElementById("showCollab").checked;
    
    sortedDates.forEach(dateKey => {
        const dayData = papersByDate[dateKey];
        
        // Create day section
        const daySection = document.createElement("div");
        daySection.className = "day-section";
        
        // Date header
        const dateHeader = document.createElement("h3");
        if (dayData.date.getTime() === today.getTime()) {
            dateHeader.innerHTML = "Today";
        } else {
            dateHeader.innerHTML = dayData.date.toDateString();
        }
        daySection.appendChild(dateHeader);
        
        // Two column container
        const columnsDiv = document.createElement("div");
        columnsDiv.className = "day-columns";
        
        // Author papers column
        const authorColumn = document.createElement("div");
        authorColumn.className = "author-column";
        if (!hideAuthorChecked) authorColumn.classList.add("hidden");
        
        dayData.authorPapers.forEach(paper => {
            authorColumn.appendChild(createPaperCard(paper));
        });
        
        // Collab papers column
        const collabColumn = document.createElement("div");
        collabColumn.className = "collab-column";
        if (!hideCollabChecked) collabColumn.classList.add("hidden");
        
        dayData.collabPapers.forEach(paper => {
            collabColumn.appendChild(createPaperCard(paper));
        });
        
        columnsDiv.appendChild(authorColumn);
        columnsDiv.appendChild(collabColumn);
        daySection.appendChild(columnsDiv);
        
        papersContainer.appendChild(daySection);
    });
    
    if (typeof MathJax !== 'undefined' && MathJax.typeset) {
        MathJax.typeset();
    }
}

function createPaperCard(paper) {
    const card = document.createElement("div");
    card.className = "paper-card";
    
    const meta = paper["metadata"];
    const title = meta["titles"][0]["title"];
    const id = paper["id"];
    
    // Paper header with title and bookmark button
    const headerDiv = document.createElement("div");
    headerDiv.className = "paper-header";
    
    const titleA = document.createElement("a");
    titleA.className = "papertitle";
    titleA.href = `https://inspirehep.net/literature/${id}`;
    titleA.target = "_blank";
    titleA.innerHTML = title;
    
    const bookmarkBtn = createBookmarkButton(paper);
    
    headerDiv.appendChild(titleA);
    headerDiv.appendChild(bookmarkBtn);
    
    const authorsP = document.createElement("p");
    authorsP.className = "authors";
    
    // Add collaboration badge if applicable
    if (paper._displayCollab && paper._displayCollabName) {
        const collabA = document.createElement("a");
        collabA.className = "sub";
        collabA.innerHTML = paper._displayCollabName;
        collabA.href = `https://inspirehep.net/search?p=collaboration%3A%22${paper._displayCollabName}%22`;
        collabA.target = "_blank";
        authorsP.appendChild(collabA);
    }
    
    // Add authors
    if (meta["author_count"] > 0) {
        const authors = meta["authors"];
        let skip = authors.length > 10;
        let count = 0;
        
        authors.forEach(author => {
            let isSub = checkForSub(author);
            if (skip && !isSub && count > 10) {
                return;
            }
            count++;
            
            const authorA = document.createElement("a");
            if (isSub) {
                authorA.className = "sub";
            }
            authorA.innerHTML = author["full_name"];
            authorA.href = `https://inspirehep.net/authors/${author["recid"]}`;
            authorA.target = "_blank";
            authorsP.appendChild(authorA);
        });
        
        if (skip) {
            const moreSpan = document.createElement("span");
            moreSpan.className = "more-authors";
            moreSpan.innerHTML = "...and more";
            authorsP.appendChild(moreSpan);
        }
    }
    
    card.appendChild(headerDiv);
    card.appendChild(authorsP);
    
    return card;
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
    
    const dateRange = getDateRange();
    const query = `author:${authorId} and date:${dateRange.start}->${dateRange.end}`;
    
    fetch(`https://inspirehep.net/api/literature?sort=mostrecent&size=100&page=1&q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((json) => addPaper(json, false))
        .catch((error) => {
            console.error("Error fetching papers:", error);
            pendingRequests--;
            checkLoadingComplete();
        });
}

function searchPaperCollab(collab) {
    const dateRange = getDateRange();
    const collabName = collab["collaboration"]["value"];
    const query = `collaboration:${collabName} and date:${dateRange.start}->${dateRange.end}`;
    
    fetch(`https://inspirehep.net/api/literature?sort=mostrecent&size=100&page=1&q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((json) => addPaper(json, true, collabName))
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
        hideLoadMore();
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

function loadMorePapers() {
    const totalSubs = authorList.length + collabList.length;
    
    if (totalSubs === 0) {
        return;
    }
    
    // Increment weeks and search for more
    currentWeeksBack++;
    
    // Show loading state on button
    const loadMoreText = document.getElementById("loadMoreText");
    const loadMoreSpinner = document.getElementById("loadMoreSpinner");
    if (loadMoreText) loadMoreText.textContent = "Loading...";
    if (loadMoreSpinner) loadMoreSpinner.style.display = "inline-block";
    
    pendingRequests = totalSubs;
    
    authorList.forEach((ele) => {
        searchPaper(ele);
    });
    
    collabList.forEach((ele) => {
        searchPaperCollab(ele);
    });
}

function showLoadMore() {
    const container = document.getElementById("loadMoreContainer");
    if (container) {
        container.style.display = "flex";
        updateDateRangeInfo();
    }
}

function hideLoadMore() {
    const container = document.getElementById("loadMoreContainer");
    if (container) {
        container.style.display = "none";
    }
}

function updateDateRangeInfo() {
    const info = document.getElementById("dateRangeInfo");
    const loadMoreText = document.getElementById("loadMoreText");
    const loadMoreSpinner = document.getElementById("loadMoreSpinner");
    
    if (info) {
        const weekText = currentWeeksBack === 1 ? "week" : "weeks";
        info.textContent = `Showing papers from the last ${currentWeeksBack} ${weekText}`;
    }
    
    if (loadMoreText) loadMoreText.textContent = "Load More Papers";
    if (loadMoreSpinner) loadMoreSpinner.style.display = "none";
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
    const authorColumns = document.getElementsByClassName("author-column");
    const authorHeader = document.querySelector(".author-column-header");
    
    for (let i = 0; i < authorColumns.length; i++) {
        if (ShowAuthor) {
            authorColumns[i].classList.remove("hidden");
        } else {
            authorColumns[i].classList.add("hidden");
        }
    }
    
    if (authorHeader) {
        authorHeader.style.opacity = ShowAuthor ? "1" : "0.3";
    }
}

function hideCollab(el) {
    let ShowCollab = el.checked;
    const collabColumns = document.getElementsByClassName("collab-column");
    const collabHeader = document.querySelector(".collab-column-header");
    
    for (let i = 0; i < collabColumns.length; i++) {
        if (ShowCollab) {
            collabColumns[i].classList.remove("hidden");
        } else {
            collabColumns[i].classList.add("hidden");
        }
    }
    
    if (collabHeader) {
        collabHeader.style.opacity = ShowCollab ? "1" : "0.3";
    }
}

// ==========================================================================
// Reading List
// ==========================================================================

function isInReadingList(paperId) {
    return readingList.some(item => item.id === paperId);
}

function getReadingListItem(paperId) {
    return readingList.find(item => item.id === paperId);
}

function addToReadingList(paper) {
    if (isInReadingList(paper.id)) {
        return;
    }
    
    const readingItem = {
        id: paper.id,
        title: paper.metadata.titles[0].title,
        authors: paper.metadata.authors ? paper.metadata.authors.slice(0, 3).map(a => a.full_name) : [],
        addedAt: new Date().toISOString(),
        isRead: false,
        url: `https://inspirehep.net/literature/${paper.id}`
    };
    
    readingList.unshift(readingItem);
    localStorage.setItem("readingList", JSON.stringify(readingList));
    
    updateReadingListUI();
    updatePaperBookmarkButtons();
}

function removeFromReadingList(paperId) {
    readingList = readingList.filter(item => item.id !== paperId);
    localStorage.setItem("readingList", JSON.stringify(readingList));
    
    updateReadingListUI();
    updatePaperBookmarkButtons();
}

function toggleReadStatus(paperId) {
    const item = getReadingListItem(paperId);
    if (item) {
        item.isRead = !item.isRead;
        localStorage.setItem("readingList", JSON.stringify(readingList));
        updateReadingListUI();
    }
}

function updateReadingCount() {
    const badge = document.getElementById("readingCount");
    const unreadCount = readingList.filter(item => !item.isRead).length;
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? "inline" : "none";
    }
}

function updateEmptyReadingState() {
    const emptyState = document.getElementById("emptyReadingState");
    const listItems = document.getElementById("readingListItems");
    
    const filteredList = getFilteredReadingList();
    
    if (filteredList.length === 0) {
        if (emptyState) {
            emptyState.style.display = "block";
            if (readingList.length === 0) {
                emptyState.textContent = "No papers in your reading list yet. Click the bookmark icon on papers to add them.";
            } else {
                emptyState.textContent = `No ${currentReadingFilter} papers in your reading list.`;
            }
        }
        if (listItems) listItems.style.display = "none";
    } else {
        if (emptyState) emptyState.style.display = "none";
        if (listItems) listItems.style.display = "block";
    }
}

function getFilteredReadingList() {
    switch (currentReadingFilter) {
        case 'unread':
            return readingList.filter(item => !item.isRead);
        case 'read':
            return readingList.filter(item => item.isRead);
        default:
            return readingList;
    }
}

function filterReadingList(filter, buttonEl) {
    currentReadingFilter = filter;
    
    // Update active button
    const buttons = document.querySelectorAll('.reading-list-filters .btn-filter');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (buttonEl) buttonEl.classList.add('active');
    
    updateReadingListUI();
}

function updateReadingListUI() {
    const listContainer = document.getElementById("readingListItems");
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    
    const filteredList = getFilteredReadingList();
    
    filteredList.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.className = `reading-list-item ${item.isRead ? 'is-read' : ''}`;
        itemDiv.dataset.id = item.id;
        
        const contentDiv = document.createElement("div");
        contentDiv.className = "reading-item-content";
        
        const titleLink = document.createElement("a");
        titleLink.className = "reading-item-title";
        titleLink.href = item.url;
        titleLink.target = "_blank";
        titleLink.innerHTML = item.title;
        
        const authorsSpan = document.createElement("span");
        authorsSpan.className = "reading-item-authors";
        authorsSpan.textContent = item.authors.join(", ") + (item.authors.length >= 3 ? " et al." : "");
        
        contentDiv.appendChild(titleLink);
        contentDiv.appendChild(authorsSpan);
        
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "reading-item-actions";
        
        // Toggle read button
        const toggleBtn = document.createElement("button");
        toggleBtn.className = `btn-icon ${item.isRead ? 'is-read' : ''}`;
        toggleBtn.title = item.isRead ? "Mark as unread" : "Mark as read";
        toggleBtn.innerHTML = item.isRead ? "◉" : "○";
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            toggleReadStatus(item.id);
        };
        
        // Remove button
        const removeBtn = document.createElement("button");
        removeBtn.className = "btn-icon btn-remove";
        removeBtn.title = "Remove from reading list";
        removeBtn.innerHTML = "×";
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeFromReadingList(item.id);
        };
        
        actionsDiv.appendChild(toggleBtn);
        actionsDiv.appendChild(removeBtn);
        
        itemDiv.appendChild(contentDiv);
        itemDiv.appendChild(actionsDiv);
        
        listContainer.appendChild(itemDiv);
    });
    
    updateReadingCount();
    updateEmptyReadingState();
    
    // Re-render MathJax for reading list
    if (typeof MathJax !== 'undefined' && MathJax.typeset) {
        MathJax.typeset();
    }
}

function updatePaperBookmarkButtons() {
    const bookmarkBtns = document.querySelectorAll('.bookmark-btn');
    bookmarkBtns.forEach(btn => {
        const paperId = btn.dataset.paperId;
        const isBookmarked = isInReadingList(paperId);
        btn.classList.toggle('bookmarked', isBookmarked);
        btn.innerHTML = isBookmarked ? "★" : "☆";
        btn.title = isBookmarked ? "Remove from reading list" : "Add to reading list";
    });
}

function createBookmarkButton(paper) {
    const btn = document.createElement("button");
    btn.className = `bookmark-btn ${isInReadingList(paper.id) ? 'bookmarked' : ''}`;
    btn.dataset.paperId = paper.id;
    btn.innerHTML = isInReadingList(paper.id) ? "★" : "☆";
    btn.title = isInReadingList(paper.id) ? "Remove from reading list" : "Add to reading list";
    btn.onclick = (e) => {
        e.stopPropagation();
        if (isInReadingList(paper.id)) {
            removeFromReadingList(paper.id);
        } else {
            addToReadingList(paper);
        }
    };
    return btn;
}

function showReadingList(el) {
    let subDiv = document.getElementById("readingListSection");
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

// Initialize reading list on page load
updateReadingListUI();

// ==========================================================================
// Keyboard Navigation (Vim-style)
// ==========================================================================

let selectedPaperIndex = -1;
let visiblePapers = [];

function updateVisiblePapers() {
    visiblePapers = [];
    const paperCards = document.querySelectorAll('.paper-card');
    
    paperCards.forEach((card, index) => {
        // Check if the card is visible (not in a hidden column)
        const column = card.closest('.author-column, .collab-column');
        if (column && !column.classList.contains('hidden')) {
            visiblePapers.push(card);
        }
    });
    
    return visiblePapers;
}

function selectPaper(index) {
    updateVisiblePapers();
    
    // Remove previous selection
    const previouslySelected = document.querySelector('.paper-card.selected');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected');
    }
    
    // Remove focus from load more button
    const loadMoreBtn = document.querySelector('.btn-load-more');
    if (loadMoreBtn) {
        loadMoreBtn.classList.remove('focused');
    }
    
    // Bounds check
    if (visiblePapers.length === 0) {
        selectedPaperIndex = -1;
        return;
    }
    
    // If trying to go past the last paper, focus the Load More button
    if (index >= visiblePapers.length) {
        selectedPaperIndex = visiblePapers.length; // Set to length to indicate "past end"
        if (loadMoreBtn && loadMoreBtn.offsetParent !== null) {
            loadMoreBtn.classList.add('focused');
            loadMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            loadMoreBtn.focus();
        }
        return;
    }
    
    if (index < 0) index = 0;
    
    selectedPaperIndex = index;
    
    // Add selection to new paper
    const selectedCard = visiblePapers[selectedPaperIndex];
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function getSelectedPaper() {
    updateVisiblePapers();
    if (selectedPaperIndex >= 0 && selectedPaperIndex < visiblePapers.length) {
        return visiblePapers[selectedPaperIndex];
    }
    return null;
}

function getSelectedPaperData() {
    const card = getSelectedPaper();
    if (!card) return null;
    
    // Find the paper in paperList by matching the URL
    const titleLink = card.querySelector('.papertitle');
    if (!titleLink) return null;
    
    const href = titleLink.href;
    const idMatch = href.match(/literature\/(\d+)/);
    if (!idMatch) return null;
    
    const paperId = idMatch[1];
    return paperList.find(p => p.id === paperId);
}

function handleKeyboardNavigation(event) {
    // Don't handle if user is typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    const key = event.key.toLowerCase();
    
    // Handle Escape to close help
    if (event.key === 'Escape') {
        closeKeyboardHelp();
        return;
    }
    
    switch (key) {
        case 'j': // Next paper
            event.preventDefault();
            selectPaper(selectedPaperIndex + 1);
            break;
            
        case 'k': // Previous paper
            event.preventDefault();
            selectPaper(selectedPaperIndex - 1);
            break;
            
        case 's': // Bookmark/unbookmark
            event.preventDefault();
            const paperToBookmark = getSelectedPaperData();
            if (paperToBookmark) {
                if (isInReadingList(paperToBookmark.id)) {
                    removeFromReadingList(paperToBookmark.id);
                } else {
                    addToReadingList(paperToBookmark);
                }
            }
            break;
            
        case 'm': // Mark as read/unread
            event.preventDefault();
            const paperToMark = getSelectedPaperData();
            if (paperToMark && isInReadingList(paperToMark.id)) {
                toggleReadStatus(paperToMark.id);
            }
            break;
            
        case 'enter': // Open paper
            event.preventDefault();
            const selectedCard = getSelectedPaper();
            if (selectedCard) {
                const link = selectedCard.querySelector('.papertitle');
                if (link) {
                    window.open(link.href, '_blank');
                }
            }
            break;
            
        case 'g': // Go to top/bottom
            event.preventDefault();
            if (event.shiftKey) {
                // G (shift+g) goes to last paper
                updateVisiblePapers();
                selectPaper(visiblePapers.length - 1);
            } else {
                // g goes to first paper
                selectPaper(0);
            }
            break;
            
        case '?': // Show help
            event.preventDefault();
            showKeyboardHelp();
            break;
    }
}

function showKeyboardHelp() {
    const existingHelp = document.getElementById('keyboardHelp');
    if (existingHelp) {
        existingHelp.remove();
        return;
    }
    
    const helpDiv = document.createElement('div');
    helpDiv.id = 'keyboardHelp';
    helpDiv.className = 'keyboard-help';
    helpDiv.innerHTML = `
        <div class="keyboard-help-content">
            <h3>Keyboard Shortcuts</h3>
            <ul>
                <li><kbd>j</kbd> Next paper</li>
                <li><kbd>k</kbd> Previous paper</li>
                <li><kbd>s</kbd> Bookmark/unbookmark paper</li>
                <li><kbd>m</kbd> Mark as read/unread</li>
                <li><kbd>Enter</kbd> Open paper in new tab</li>
                <li><kbd>g</kbd> Go to first paper</li>
                <li><kbd>G</kbd> Go to last paper</li>
                <li><kbd>?</kbd> Toggle this help</li>
                <li><kbd>Esc</kbd> Close this help</li>
            </ul>
            <button onclick="closeKeyboardHelp()" class="btn btn-secondary">Close</button>
        </div>
    `;
    
    // Close when clicking outside the content
    helpDiv.addEventListener('click', (e) => {
        if (e.target === helpDiv) {
            closeKeyboardHelp();
        }
    });
    
    document.body.appendChild(helpDiv);
}

function closeKeyboardHelp() {
    const existingHelp = document.getElementById('keyboardHelp');
    if (existingHelp) {
        existingHelp.remove();
    }
}

// Initialize keyboard navigation
document.addEventListener('keydown', handleKeyboardNavigation);
