//////////////////////////////////////////////////////////////////////////////////
// 707 Chinese Simplified SDA Hymnal Progressive Web App (PWA)
// 707颂赞诗歌
// Copyright 2026 Enoch Hwang

//const APP_NAME = "Chinese_Simplified";
const APP_NAME = "707颂赞诗歌";
var currentListPages = NUMERIC_PAGES; // initial list
let currentBookmarkFolder = "Folder 1";


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Start of program. Execute this when program loads
window.addEventListener('load', async () => {
  const savedList = localStorage.getItem(APP_NAME+"_currentListPages");
  const savedIndex = localStorage.getItem(APP_NAME+"_swiperindex");

//  if (!savedList || !savedIndex) {
  if (true) {
    // --- FIRST TIME RUN ---
    console.log("First time run! Defaulting to index 0.");
    syncSwiper();
    swiper.slideTo(0, 0);
    //localStorage.setItem(APP_NAME+"_swiperindex", 0);
    //localStorage.setItem(APP_NAME+"_currentListPages", JSON.stringify(currentListPages));        
  } else {
    // --- SUBSEQUENT RUNS (Restore State) ---
    console.log("Restoring previous state...");
    currentListPages = JSON.parse(savedList);
    
    syncSwiper();
    
    // Jump to the saved song
    swiper.slideTo(parseInt(savedIndex), 0);
  }
  
  // Request wake lock to prevent screen timeout
  requestWakeLock();

  // Show update alert if there's an update
  if (updateAlert) {
    showToast("New updates available");
    updateAlert = false;
  }

});

// This is called when the app is moved to the foreground or background
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === "visible") {
    // Request wake lock to prevent screen timeout
    if (wakeLock !== null) {
      await requestWakeLock();
    }
    
    // Show update alert if there's an update
    if (updateAlert) {
      showToast("New updates available");
      updateAlert = false;
    }
  } else {
    // Final safety save state when app goes to background
    //localStorage.setItem(APP_NAME+"_swiperindex", swiper.activeIndex);
    //localStorage.setItem(APP_NAME+"_currentListPages", JSON.stringify(currentListPages));
  }
});

// when back online re-fetch all the broken img links
window.addEventListener('online', () => {
  //console.log("%c" + "Online", "color: green;");
  //showToast("Online");
  
  // load all broken images in the swiper
  document.querySelectorAll('.swiper-zoom-container img').forEach(img => {
    // If the image is broken (naturalWidth is 0)
    if (img.naturalWidth === 0) {
      const title = img.dataset.title;
      console.log(`online event:Refetching: ${title}`);
      // The '?refetch=' + Date.now() part clears the browser's memory and do a refetch
      img.src = `songsheets/${title}.png?refetch=` + Date.now();
    }
  });
});

window.addEventListener('offline', () => {
  //console.log("%c" + "Offline", "color: red;");
  //showToast("Offline");
});


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Initialize Swiper
/*
// original
var swiper = new Swiper(".swiper", {
    zoom: {
        maxRatio: 5,
        minRatio: 1,
        toggle: false // DISABLE Double-Tap Zoom (Crucial for Long Press)
    },
    grabCursor: true,
    speed: 500,
    virtual: {
      renderSlide: function (title, index) {
        //<div> format
        //<div class="swiper-slide">
        //  <div class="swiper-zoom-container">
        //    <img src="songsheets/1 Praise to the Lord.png">
        //  </div>
        //</div>

        const swiper_slide = document.createElement('div');
        swiper_slide.className = 'swiper-slide';
        const swiper_zoom = document.createElement('div');
        swiper_zoom.className = 'swiper-zoom-container';
        const img = document.createElement('img');
        
        // 1. Check if this specific title exists in Local Storage (Imported Song)
        const localData = localStorage.getItem(`MySong_${title}`);
        if (localData) {
          // It's a My Song! Use the Base64 data from local storage
          img.src = localData;
        } else {
          img.src = `songsheets/${title}.png`;
        }
        img.alt = title;
        img.dataset.title = title;  // IMPORTANT: Store the title here so the Wrapper can find it later
        swiper_zoom.appendChild(img);
        swiper_slide.appendChild(swiper_zoom);
        return swiper_slide;
    }
  }
});
*/

let swiper = new Swiper(".swiper", {
    zoom: {
        maxRatio: 5,
        minRatio: 1,
        toggle: false // disable Double-Tap Zoom (Crucial for Long Press)
    },
    grabCursor: true,
    speed: 500,
    virtual: {
      renderSlide: function (title, index) {
        //<div> format
        //<div class="swiper-slide">
        //  <div class="swiper-zoom-container">
        //    <img src="songsheets/1 Praise to the Lord.png">
        //  </div>
        //</div>
        
        const swiper_slide = document.createElement('div');
        swiper_slide.className = 'swiper-slide';
        const swiper_zoom = document.createElement('div');
        swiper_zoom.className = 'swiper-zoom-container';
        const img = document.createElement('img');
        
        // check for MySongs in local storage first
        const mySongs = JSON.parse(localStorage.getItem(APP_NAME+"_MySongs") || '{}');
        if (mySongs[title]) {
          // It's a My Song! Use the Base64 data from local storage
          img.src = mySongs[title];
          
        } else {  // it's a regular song in songsheet. Fetch it from cache or network
          img.src = `songsheets/${title}.png`;
        }

        img.alt = title;
        img.dataset.title = title;  // Store the title here so the Wrapper can find it later
        swiper_zoom.appendChild(img);
        swiper_slide.appendChild(swiper_zoom);
        return swiper_slide;
      }
    },
  
    // this on block is to re-fetch the broken img links when back online
    on: {
      // Trigger as soon as the swipe starts
      slideChange: function() {
        // We use a tiny timeout to ensure the DOM has updated the 'active' class
        setTimeout(() => {
          const activeSlide = this.el.querySelector('.swiper-slide-active');
          if (activeSlide) {
            const img = activeSlide.querySelector('img');
            // check if it's a broken songsheet. It's broken if img.naturalWidth === 0
            if (img && img.src.includes('songsheets/') && img.naturalWidth === 0) {
              const title = img.dataset.title;
///////// TODO always coming here when selecting a song from 123 index or ABC index              
              console.log(`swiper:Refetching: ${title}`);
              // The '?refetch=' + Date.now() part clears the browser's memory and do a refetch
              img.src = `songsheets/${title}.png?refetch=` + Date.now();

            }
          }
        }, 50); // 50ms is unnoticeable but enough for Swiper to sync
      }
        
    } // end on
    
});


// load and update the swiper
function syncSwiper() {
  swiper.virtual.removeAllSlides();
  swiper.virtual.slides = currentListPages;  // populate swiper with the currentListPages
  if (swiper.virtual.cache) swiper.virtual.cache = {};  // Clear the Virtual Cache
  swiper.virtual.update();  // Update the Virtual Engine
  swiper.update();          // Update the Swiper Layout
}

//syncSwiper();

// After adding the slides, you MUST do a swiper update
// The Swiper MUST be created here AFTER adding the slides
// If created BEFORE then must do
// swiper.update();

/*
const slide = document.createElement('div');
slide.className = 'swiper-slide';

const img = document.createElement('img');
img.src = 'songsheets/SomeSong.png';
slide.appendChild(img);

// Optional: Add your long press handler
slide.addEventListener('touchstart', ...);

swiper.appendSlide(slide.outerHTML);

swiper.appendSlide('<div class="swiper-slide">New Slide</div>');
swiper.prependSlide('<div class="swiper-slide">First Slide</div>');
swiper.addSlide(3, '<div class="swiper-slide">Slide at index 3</div>');
swiper.removeSlide(3);
swiper.removeSlide([2, 4, 6]);
swiper.removeAllSlides();

*/


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Menu bar buttons
function onMenuPress(id) {
  addBookmarkMenuOverlay.style.display = "none";  // hide the Add Bookmark Menu
  //console.log(`Menu button ${id} pressed`);
  //alert(`Menu button ${id} pressed`);
  switch(id) {
    case 'icon': { // app icon
      numericList.style.display = 'none';
      numericListSidebar.style.display = 'none';
      alphabeticList.style.display = 'none';
      alphabeticListSidebar.style.display = 'none';
      bookmarkListContainer.style.display = 'none';
      moreMenuOverlay.style.display = 'none';
      
      stopAudio();
      closeSearch();  // clear search bar if currently being displayed
      
      // go to page 1 of current song
      // get songname
      let currentFullTitle = currentListPages[swiper.activeIndex];
      if (currentFullTitle) {
        // extract number at the end for multi-page
        let baseSongName = currentFullTitle.replace(/\d+$/, '');

        // Find the index of the very first page for this song in the current list
        let firstPageIndex = currentListPages.findIndex(name => name === baseSongName);

        // If we found it and we aren't already there, slide to it
        if (firstPageIndex !== -1 && firstPageIndex !== swiper.activeIndex) {
          swiper.slideTo(firstPageIndex, 0);
        }
      }
      break;
    }
    
    case 'search': { // search
      moreMenuOverlay.style.display = 'none';
      navIcons.style.display = 'none';
      searchBarContainer.style.display = 'flex';
      searchInput.focus(); // Automatically pull up keyboard
      // Small delay to allow keyboard animation to start
      setTimeout(adjustSearchListHeight, 100);
      break;
    }
    
    case 'numeric': { // numeric list
      moreMenuOverlay.style.display = 'none';
      currentListPages = NUMERIC_PAGES;
      if (numericList.style.display === 'none') {  // is the list hidden?
        numericList.style.display = 'block';
        numericListSidebar.style.display = 'flex';
      } else {
        numericList.style.display = 'none';
        numericListSidebar.style.display = 'none';
      }
      // hide the other lists
      alphabeticList.style.display = 'none';
      alphabeticListSidebar.style.display = 'none';
      bookmarkListContainer.style.display = 'none';
      searchList.style.display = 'none';
      moreMenuOverlay.style.display = 'none';
      break;
    }
    
    case 'alphabetic': { // alphabetic list
      currentListPages = ALPHABETIC_PAGES;
      if (alphabeticList.style.display === 'none') {  // is the list hidden?
        alphabeticList.style.display = 'block';
        alphabeticListSidebar.style.display = 'flex';
      } else {
        alphabeticList.style.display = 'none';
        alphabeticListSidebar.style.display = 'none';
      }
      // hide the other lists
      numericList.style.display = 'none';
      numericListSidebar.style.display = 'none';
      bookmarkListContainer.style.display = 'none';
      searchList.style.display = 'none';
      moreMenuOverlay.style.display = 'none';
      break;
    }
    
    case 'bookmark': { // bookmark list
      if (bookmarkListContainer.style.display === 'none') {
        bookmarkListContainer.style.display = 'flex'; // Use flex, not block!
        createBookmarkList(); 
      } else {
        bookmarkListContainer.style.display = 'none';
      }
      numericList.style.display = 'none';
      numericListSidebar.style.display = 'none';
      alphabeticList.style.display = 'none';
      alphabeticListSidebar.style.display = 'none';
      searchList.style.display = 'none';
      moreMenuOverlay.style.display = 'none';
      break;
    }
    
    case 'play': { // play
      moreMenuOverlay.style.display = 'none';
      openMusicPlayer();
      break;
    }
    
    case 'more': { // setup
      if (moreMenuOverlay.style.display === 'block') {
          moreMenuOverlay.style.display = 'none';
      } else {
          moreMenuOverlay.style.display = 'block';
      }
      break;      
    }
    
    default:
      break;
  }
}

        
//////////////////////////////////////////////////////////////////////////////////
// More (three-dots) Popup Menu stuff
var moreMenuOverlay = document.getElementById('moreMenuOverlay');

function handleMoreAction(action) {
  moreMenuOverlay.style.display = 'none';
    
  switch(action) {
    case 'import':
      openImportMySongs();
      break;
      
    case 'share':
      if (navigator.share) {
        navigator.share({ title: '707颂赞诗歌', url: window.location.href });  // 707 Chinese Simplified SDA Hymnal
      }
      break;
      
    case 'updates':
      if (newWorker) {
        newWorker.postMessage({ action: 'update' });  // send message to service worker
        // execution continues in the service worker sw.js addEventListener('message' handler
        const updateItem = document.getElementById('updateMenuItem');
        if (updateItem) {
          updateItem.style.display = 'none'; // remove update item from menu
        }
      }
      showToast("应用已更新");   // App updated
      closeMoreMenu();
      break;
      
    case 'moreapps':
      window.open('https://hwang.lasierra.edu/~enoch/Apps', '_blank');
      break;
      
    case 'settings':
      showToast("设置功能即将推出");  // Settings coming soon
      break;
      
    case 'donate':
      window.open('https://www.paypal.com/ncp/payment/6HFPWVH9WMU8L', '_blank');
      break;
      
    case 'help':
      numericList.style.display = 'none';
      numericListSidebar.style.display = 'none';
      alphabeticList.style.display = 'none';
      alphabeticListSidebar.style.display = 'none';  
      bookmarkListContainer.style.display = 'none';
      swiper.virtual.removeAllSlides();
      swiper.virtual.slides = NUMERIC_PAGES;  // populate swiper with NUMERIC_PAGES (default)  
      currentListPages = NUMERIC_PAGES;
      swiper.virtual.update();    
      swiper.slideTo(0, 0); // jump to About page
      break;
  }
}

function closeMoreMenu() {
    moreMenuOverlay.style.display = 'none';
}


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Displays the song given the songname string
// and the global variable currentListPages
// songname format either "468 A Child of the King" (for NUMERIC_INDEX)
// or "A Child of the King 468" (for ALPHABETIC_INDEX)
// pageIndex >= 0 when called from handleBookmarkSelect. This is for when there are two or more of the same songname in the bookmark list
// pageIndex == -1 when called from attachListItemEventHandler or renderSearchList, and this value is not used in displaySong
function displaySong(songname, pageIndex) {
  // do the following only if not given the pageIndex from attachListItemEventHandler and renderSearchList
  if (pageIndex == -1) {
    // songname is either 5 赞美真神 or 赞美真神 5
    // /^(\d+)\s|\s(\d+)$/ to extract the song number either at the beginning or the end
    const match = songname.match(/^(\d+)\s|\s(\d+)$/);  // extract the song number
    let targetFilename;
    if (match) {
      const songNumber = match[1] || match[2];  // match[1] is number at the beginning; match[2] is number at the end
      targetFilename = songNumber + 'h';   // create the target filename search string (e.g., "2h")
    } else {  // there's no song number
      // see if it is in My Songs by using the songname as is
      targetFilename = songname;
    }
    pageIndex = currentListPages.findIndex(name => name === targetFilename || name.startsWith(targetFilename));
  }
  
  if (pageIndex !== -1) { // found the song
    syncSwiper();
    swiper.slideTo(pageIndex, 0);
  } else {
    console.warn("Could not find page for: ", songname);
  }
}


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
///// Update the global variable currentListPages with all the pages for the songs in folderItems
// return the swiper index for the given song
function updateCurrentListPages(songindex, folderItems) {
  const folderListPages = [];
  let pageIndex = -1;
  let songPages;

  folderItems.forEach((item, index) => {
    // Extract number at the beginning for Numeric List "468 A Child of the King"
    // /^(\d+)\s|\s(\d+)$/ to extract the song number either at the beginning or the end
    const match = item.match(/^(\d+)\s/);

    if (match) {
      const songNumber = match[1];
      const targetPrefix = songNumber + 'h';  // append "h" for filename
      
      // Search NUMERIC_PAGES for multi pages belonging to this song
      // This regex matches "262h", "262h2", "262h3", etc.
      const regex = new RegExp('^' + targetPrefix + '\\d*$');
      songPages = NUMERIC_PAGES.filter(p => regex.test(p));
      
      // remove duplicates e.g. His Eye Is On the Sparrow occurs twice in the NUMERIC_PAGES list
      songPages = [...new Set(songPages)];
      
    } else {  // It's a My Song
      if (currentBookmarkFolder === "Folder 4") {
        songPages = [item];
        
      } else {  // otherwise it might be a multipage song so need to add all the pages for the song
        const mySongs = JSON.parse(localStorage.getItem(APP_NAME + "_MySongs") || '{}');
        const mySongKeys = Object.keys(mySongs);  // get a list of all the song names from My Songs

        // get all the pages for the song. Search for matches like "SongName", "SongName 1", "SongName 2"
        songPages = mySongKeys.filter(key => 
          key === item || (key.startsWith(item) && key.slice(item.length).match(/^\s*\d*$/))
        );

        // sort numerically (so "Song 10" comes after "Song 2")
        songPages.sort((a, b) => {
          const numA = parseInt(a.slice(item.length)) || 0;
          const numB = parseInt(b.slice(item.length)) || 0;
          return numA - numB;
        });
      }
    }
    
    // Calculate the index for the swiper to jump to if needed
    // set the actual pageIndex of the selected page in folderListPages
    // this is needed if a song occurs more than once in the bookmark list
    // and the second occurence of the song is selected
    if (index == songindex) {
      pageIndex = folderListPages.length;
    }

    // Add all the multi pages for the song to our new swiper list
    folderListPages.push(...songPages);
    
  });

  // Update the global currentListPages
  currentListPages = folderListPages;

  return pageIndex;
} // end updateCurrentListPages


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Lists stuff
// Create the Numeric and Alphabetic lists
var numericList = document.getElementById('numericList');
var numericListSidebar = document.getElementById('numericListSidebar');
var alphabeticList = document.getElementById('alphabeticList');
var alphabeticListSidebar = document.getElementById('alphabeticListSidebar');
var bookmarkList = document.getElementById('bookmarkList');
var bookmarkListContainer = document.getElementById('bookmarkList-container');


//////////////////////////////////////////////////////////////////////////////////
NUMERIC_INDEX.forEach((songname, index) => {
  const item = document.createElement('div');
  item.className = 'list-item';
  item.textContent = songname;
  /*
  // Automatic create the fast scroll sidebar group label mapping to the list index
  // The group by hundred must match the code in createFastScroll function
  const match = songname.match(/^\d+/);  // extract number at the beginning like "1 Praise to the Lord"
  const songNumber = match ? parseInt(match[0], 10) : 0;
  if (songNumber > 0) {
    // this is for increments of 100
    const groupHundred = Math.floor(songNumber / 100) * 100;
    item.setAttribute('data-group-numeric', groupHundred);
  }
  */
  attachListItemEventHandler(item, songname); // attached the touch and mouse event handlers for this song
  
  numericList.appendChild(item);        // add item to list
});


//////////////////////////////////////////////////////////////////////////////////
ALPHABETIC_INDEX.forEach((songname, index) => {
  const item = document.createElement('div');
  item.className = 'list-item';
  item.textContent = songname;
  /*
  // Automatic create the fast scroll sidebar group label mapping to the list index
  let firstChar = songname.charAt(0).toUpperCase();  // get the first character of song name
  // If not a letter then second character must be a letter
  if (!/^[A-Z]$/.test(firstChar)) {
    firstChar = songname.charAt(1).toUpperCase();
  }
  // set the attribute needed in querySelector in the createFastScroll/handleScroll logic
  item.setAttribute('data-group-alphabetic', firstChar);
  */
  attachListItemEventHandler(item, songname); // attached the touch and mouse event handlers for this song

  alphabeticList.appendChild(item);     // add item to list
});


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// FastScroll
// Manual create the fast scroll sidebar group label mapping to the list index
// The list index is zero based
// Format: [group label, list index for the start of the group]
const numericListScrollMap = new Map([
  ["000", 0],
  ["100", 99],
  ["200", 199],
  ["300", 299],
  ["400", 399],
  ["500", 499],
  ["600", 599],
  ["700", 699]
]);

const alphabeticListScrollMap = new Map([
  ["A", 0],
  ["B", 17],
  ["C", 39],
  ["D", 55],
  ["E", 73],
  ["F", 76],
  ["G", 82],
  ["H", 110],
  ["J", 131],
  ["K", 181],
  ["L", 202],
  ["M", 221],
  ["N", 246],
  ["P", 257],
  ["Q", 264],
  ["R", 298],
  ["S", 320],
  ["T", 369],
  ["W", 396],
  ["X", 471],
  ["Y", 503],
  ["Z", 585]
]);


//////////////////////////////////////////////////////////////////////////////////
// Initialize the fast scroll sidebars
// (Make sure NUMERIC_INDEX and ALPHABETIC_INDEX are loaded before running this)
createFastScroll('numericListSidebar', 'numericList', 'data-group-numeric', NUMERIC_INDEX);
createFastScroll('alphabeticListSidebar', 'alphabeticList', 'data-group-alphabetic', ALPHABETIC_INDEX);


//////////////////////////////////////////////////////////////////////////////////
// Create the fast scroll sidebar
function createFastScroll(sidebarId, listId, dataAttribute, itemsArray) {
  const sidebar = document.getElementById(sidebarId);
  const list = document.getElementById(listId);
  const container = document.querySelector('.songsheet-container'); 
  let isDragging = false; 

  // 1. SELECT THE CORRECT MAP
  const activeMap = (sidebarId === 'numericListSidebar') ? numericListScrollMap : alphabeticListScrollMap;

  // 2. CREATE BUBBLE (Visual Feedback)
  let bubble = document.getElementById(sidebarId + '-bubble');
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.id = sidebarId + '-bubble';
    bubble.className = 'fast-scroll-bubble';
    container.appendChild(bubble);
  }

  // 3. GENERATE GROUPS AUTOMATICALLY FROM MAP KEYS
  const groups = Array.from(activeMap.keys());

  // 4. RENDER SIDEBAR ITEMS
  sidebar.innerHTML = '';
  groups.forEach(label => {
    const div = document.createElement('div');
    div.className = 'fast-scroll-item';
    div.innerText = label;
    div.dataset.target = label;
    sidebar.appendChild(div);
  });

  // 5. THE SCROLL HANDLER
  const handleScroll = (e) => {
    if (!isDragging) return;

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const firstChild = sidebar.firstElementChild.getBoundingClientRect();
    const lastChild = sidebar.lastElementChild.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const labelAreaTop = firstChild.top;
    const labelAreaHeight = lastChild.bottom - firstChild.top;
    let relativeY = clientY - labelAreaTop;
    
    // Determine which label is under the finger
    let index;
    if (relativeY <= 0) {
        index = 0;
    } else {
        const percent = Math.max(0, Math.min(relativeY / labelAreaHeight, 0.999));
        index = Math.floor(percent * groups.length);
    }
    
    const char = groups[index];

    if (char !== undefined && char !== null) {
      // Update Bubble Text & Position
      bubble.innerText = char;
      let bubbleY = clientY - containerRect.top;
      bubbleY = Math.max(30, Math.min(bubbleY, containerRect.height - 30));
      bubble.classList.add('show');
      bubble.style.transform = `translateY(${bubbleY - 30}px)`;

      // SCROLL LOGIC USING THE MAP
      const itemIndex = activeMap.get(char);
      
      if (itemIndex !== undefined) {
        const targetListItem = list.children[itemIndex];
        if (targetListItem) {
          // Precise scroll using offsetTop for smoother performance
          list.scrollTop = targetListItem.offsetTop;
        }
      }
    }

    if (e.cancelable) e.preventDefault();
  };

  // 6. EVENT LISTENERS
  const startDragging = (e) => {
    isDragging = true;
    if (typeof closeSearch === "function") closeSearch(); 
    handleScroll(e);
  };

  const stopDragging = () => {
    isDragging = false;
    bubble.classList.remove('show');
  };

  sidebar.addEventListener('mousedown', startDragging);
  sidebar.addEventListener('touchstart', startDragging, { passive: false });

  window.addEventListener('mousemove', (e) => { if (isDragging) handleScroll(e); });
  window.addEventListener('touchmove', (e) => { 
    if (isDragging) handleScroll(e); 
  }, { passive: false });

  window.addEventListener('mouseup', stopDragging);
  window.addEventListener('touchend', stopDragging);
  window.addEventListener('touchcancel', stopDragging);
} // end createFastScroll


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Handle gestures for the Add Bookmark menu popup window
const swiperWrapper = document.querySelector('.swiper-wrapper');
const addBookmarkMenuOverlay = document.getElementById('addBookmarkMenuOverlay');
let longPressTimer = null;
let startX = 0;
let startY = 0;

// Handle longpress on songsheet to show add bookmark popup window
swiperWrapper.addEventListener('pointerdown', (e) => {
  if (!e.isPrimary) {	 // Ignore multi-touch
    clearTimeout(longPressTimer);
    longPressTimer = null;
    return;
  }
  if (swiper.zoom && swiper.zoom.scale > 1) { // Ignore when zoomed in
    clearTimeout(longPressTimer);
    longPressTimer = null;
    return;
  }
  // Prevent the browser's default "drag image" behavior 
  // which iPad often confuses with zooming
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
  }

  addBookmarkMenuOverlay.style.display = 'none';	// Hide menu if it's already open

  startX = e.clientX;
  startY = e.clientY;
  
  longPressTimer = setTimeout(() => {
    // --- LONG PRESS SONG SHEET ---
    const index = swiper.activeIndex; // get the current active song index
    const page = swiper.virtual.slides[index]; // get the page
    const songname = pages2Index(page);
    if (songname) {
      addBookmarkMenuOverlay.dataset.songname = songname; // pass songname to the addBookmarkMenuOverlay.addEventListener
      addBookmarkMenuOverlay.style.display = "flex";  // show Add Bookmark Menu popup window
      // execution continues with the addBookmarkMenuOverlay.addEventListener click events

    } else {
      // should never get here
      console.error("Could not find song title at index:", index, songname);
    }
  }, 700); // longpress hold time
});

// Prevent Default Context Menu
swiperWrapper.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});


// Touch Move (Cancel if swiping) for desktop
swiperWrapper.addEventListener('pointermove', (e) => {
  if (longPressTimer) {
    // If finger moves more than 10px, it's a swipe/pan, not a hold
    if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
});

// Touch Move (Cancel if swiping) for tablet
swiperWrapper.addEventListener('touchmove', (e) => {
  if (longPressTimer) {
    // If finger moves more than 10px, it's a swipe/pan, not a hold
    if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
}, {passive: false}); // this removed the warning but haven't tested for other side effects

// Touch End (Cancel)
swiperWrapper.addEventListener('pointerup', () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
});

// Prevent longpress popup when vertical scroll in landscape mode
const container = document.querySelector('.songsheet-container');
container.addEventListener('scroll', () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}, { passive: true });

// Go back to no zoom (1x) when device orientation change
window.addEventListener("orientationchange", () => {
  // Small delay ensures the browser has finished the rotation animation
  setTimeout(() => {
    if (swiper.zoom) {
      swiper.zoom.out();
    }
  }, 200);
});
    

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Add Bookmark Menu popup stuff
function saveBookmark(songname, folder) {
  // load existing bookmarks or null if none exists yet
  const bookmarks = JSON.parse(localStorage.getItem(APP_NAME+"_bookmarks") || "{}");
  // ensure the folder exists
  if (!bookmarks[folder]) {
    bookmarks[folder] = [];
  }
  
  // add song to bookmark folder
  bookmarks[folder].push(songname);

  // save back to localStorage
  localStorage.setItem(APP_NAME+"_bookmarks", JSON.stringify(bookmarks));

  // Refresh the bookmark list if songname is added to the current bookmark folder
  if (currentBookmarkFolder === folder) {
    createBookmarkList(); // Re-populate the bookmark list for the newly selected folder
  }
}

// This event handler is called when one of the buttons in the Add Bookmark Menu is clicked
addBookmarkMenuOverlay.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const folder = e.target.dataset.folder; // Retrieve the folder name
    const songname = addBookmarkMenuOverlay.dataset.songname;  // Retrieve the song name that was clicked

    // songname format at this point can be 
    //   "12 Joyful, Joyful, We Adore Thee",      (number at beginning)
    //   "12 Joyful, Joyful, We Adore Thee2",     (number at beginning with page number at end)
    //   "Joyful, Joyful, We Adore Thee 12"       (number at end with a space)  i.e., song number
    //   or "Pass It On2"                         (number at end with NO space) i.e., page number
    // need to change it to number at beginning and remove the page number if there's one
    //   "12 Joyful, Joyful, We Adore Thee",
    let formattedSongname = formatName(songname);  // Make songname format as "12 Joyful, Joyful, We Adore Thee"

    if (folder !== "Cancel") {
      saveBookmark(formattedSongname, folder);
      const s = folder.replace("Folder", "文件夹");
      showToast(`${formattedSongname} 已添加到 ${s}`); // added to folder 1 已添加到文件夹 1
    }
    
    addBookmarkMenuOverlay.style.display = "none"; // hide popup
  }
  
  // clicking outside popup also closes
  //if (e.target === addBookmarkMenuOverlay) {
  //  addBookmarkMenuOverlay.style.display = "none";
  //}
});
    

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Bookmark List stuff

// Disable system context menu (Download/Share) on bookmark folder tabs
document.addEventListener('contextmenu', function(e) {
  if (e.target.classList.contains('tab-btn')) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, false);

// Bookmark folder tabs switching and longpress logic
document.querySelectorAll('.tab-btn').forEach(button => {
  let longpressTimer;
  let isLongPress = false;

  const startPress = (e) => {
    isLongPress = false;
    longpressTimer = setTimeout(() => {
      // --- LONG PRESS FOLDER TAB ---
      isLongPress = true;
      const folderId = parseInt(button.getAttribute('bookmarkFolder'));
      handleFolderLongPress(folderId);
    }, 700); // Time in ms for long press
  };

  const endPress = (e) => {
    clearTimeout(longpressTimer);
    if (!isLongPress) {
      // --- SHORT PRESS FOLDER TAB ---
      const folderId = parseInt(button.getAttribute('bookmarkFolder'));
      selectFolder(folderId);
    }
  };

  const cancelPress = () => {
    clearTimeout(longpressTimer);
  };

  // Mouse Events
  button.addEventListener('mousedown', startPress);
  button.addEventListener('mouseup', endPress);
  button.addEventListener('mouseleave', cancelPress);

  // Touch Events
  button.addEventListener('touchstart', startPress, { passive: true });
  button.addEventListener('touchend', endPress);
  button.addEventListener('touchmove', cancelPress);
});

// This function runs when you long-press a folder tab
// This deletes all the items in the selected folder
// --- LONG PRESS FOLDER TAB ---
function handleFolderLongPress(folderId) {
  if (folderId === 4) {
    showToast("无法删除“我的歌曲”中的所有项目。"); // Cannot delete all items in My Songs
    return; // can't delete My Songs folder
  }
  
  if (currentBookmarkFolder === "Folder " + folderId) {
    const bookmarks = JSON.parse(localStorage.getItem(APP_NAME+"_bookmarks") || "{}");
    
    // Ensure the folder exists in the object and has items
    if (bookmarks[currentBookmarkFolder] && bookmarks[currentBookmarkFolder].length > 0) {
      
      const toast = document.getElementById('confirm-toast');
      document.getElementById('confirm-message').innerText = `清空文件夹 ${currentBookmarkFolder}?`; // Clear Folder 1?
      toast.classList.add('show');
      
      // Use { once: true } to prevent stacking multiple click listeners
      document.getElementById('confirmYesBtn').onclick = () => {  // YES to clear button clicked
        // Reload fresh data to be safe
        const currentBookmarks = JSON.parse(localStorage.getItem(APP_NAME+"_bookmarks") || "{}");
        currentBookmarks[currentBookmarkFolder] = [];   // clear the folder items
        
        localStorage.setItem(APP_NAME+"_bookmarks", JSON.stringify(currentBookmarks)); // save back to localStorage
        createBookmarkList(); 
        toast.classList.remove('show');
        //showToast(`${currentBookmarkFolder} cleared`);
      };

      document.getElementById('confirmCancelBtn').onclick = () => { // Cancel clear button clicked
        toast.classList.remove('show');
      };
      
    } else {
      showToast("没有可清除的项目"); // No items to clear
    }
    
  }
}

// This function runs when you press a folder tab
// --- SHORT PRESS FOLDER TAB ---
function selectFolder(folderId) {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach((tab, index) => {
    if (index === folderId - 1) {
      tab.classList.add('active');
      currentBookmarkFolder = "Folder "+folderId; // "Folder 1", "Folder 2", "Folder 3", or "Folder 4"
    } else {
      tab.classList.remove('active');
    }
  });

  createBookmarkList(); // Re-populate the list for the newly selected folder
}


///// Bookmark List - 
///// Part A: Create the List
function createBookmarkList() {
  // retrieve bookmark folder items from local storage
  const bookmarks = JSON.parse(localStorage.getItem(APP_NAME+"_bookmarks") || "{}");
  const currentBookmarkFolderItems = bookmarks[currentBookmarkFolder] || [];

  bookmarkList.innerHTML = '';

  // check for bookmark list empty
  if (currentBookmarkFolderItems.length === 0) {
    if (currentBookmarkFolder == "Folder 4") {
      bookmarkList.innerHTML = `<div style="padding: 20px; text-align: center; color: #888;">选择“导入我的歌曲”以导入歌曲</div>`; // Select Import My Songs to import a song
    } else {
      bookmarkList.innerHTML = `<div style="padding: 20px; text-align: center; color: #888;">长按歌曲或索引即可添加书签</div>`; // Long press song or index to add bookmark
    }
    return;
  }

  /////////////////////////////////////////////////////////////////////////
  // Create the list dynamically
  // The format for each <li> item is:
  //  <li class="swipe-item">
  //  <div class="swipe-background">
  //    <img src="trash.png" alt="Trash"/>
  //  </div>
  //  <div class="swipe-content">
  //    Item 1
  //    <img class="drag-handle" src="drag.png" alt="Drag"/>
  //  </div>
  //  </li>

  currentBookmarkFolderItems.forEach((songTitle, folderIndex) => {
    const li = document.createElement('li');
    li.className = 'swipe-item';
    li.dataset.name = songTitle;
    li.dataset.index = folderIndex;

    if (currentBookmarkFolder === "Folder 4") { // layout with Edit icon for Folder 4 My Songs
      li.innerHTML = `
        <div class="swipe-background">
          <img src="icons/ic_trash.png" alt="Trash">
        </div>
        <div class="swipe-content">
          <span class="bookmark-text">${songTitle}</span>
          <div class="icon-group">
            <img class="edit-icon" src="icons/ic_edit.png" alt="Edit">
            <img class="drag-handle" src="icons/ic_drag.png" alt="Drag" draggable="false">
          </div>
        </div>
      `;
      
    } else {  // layout WITHOUT Edit icon for Folders 1, 2 or 3
      li.innerHTML = `
        <div class="swipe-background">
          <img src="icons/ic_trash.png" alt="Trash">
        </div>
        <div class="swipe-content">
          <span class="bookmark-text">${songTitle}</span>
          <img class="drag-handle" src="icons/ic_drag.png" alt="Drag" draggable="false">
        </div>
      `;
    }

    bookmarkList.appendChild(li);
  });
}

// Prevent browser default popup menu to save/share/open image when long press on drag handle
bookmarkList.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.drag-handle')) {
    e.preventDefault(); // block long-press image menu
  }
});


//////////////////////////////////////////////////////////////////////////////////
///// Bookmark List - 
///// Part B: The Gesture Handlers for the bookmark list items
// setup touch and mouse actions for swipe to delete and drag to reorder
let swipeStartX = 0;
let swipeStartY = 0;
let offsetY = 0;

let isHorizontal = null;
let swipeItem = null;
let swipeContent = null;
let isSwiping = false;
const swipeThreshold = 100; // how much to swipe
let lastDeletedItem = null; // for undo deleted item

let dragItem = null;
let dragContent = null;
let dragStartY = 0;
let dragStartTop = 0;
let placeholder = null;

// For scrolling list when reordering
let autoScrollDirection = 0;   // -1 = up, +1 = down, 0 = none
let autoScrollRAF = null;      // requestAnimationFrame id

let longpressTimeout = null;   // check for long press on an item
let longPressed = false;       // flag for whether it is a long or short press
let shortPressHandled = false; // flag for whether a short press has been handled

// Helper functions to get the touch and mouse coordinates
function getClientX(e) {
  if (e.touches && e.touches.length > 0) {
    return e.touches[0].clientX;        // ongoing touch
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    return e.changedTouches[0].clientX; // touch that changed
  } else if (e.clientX !== undefined) {
    return e.clientX;                   // mouse event
  }
  return 0;
}

function getClientY(e) {
  if (e.touches && e.touches.length > 0) {
    return e.touches[0].clientY;        // ongoing touch
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    return e.changedTouches[0].clientY; // touch that changed
  } else if (e.clientY !== undefined) {
    return e.clientY;                   // mouse event
  }
  return 0;
}

/////////////////////////////////////////////////////////////////////////
// Bookmark List - Swipe to delete item stuff

// onSwipeStart
function onSwipeStart(e, songname) {
  swipeContent = swipeItem?.querySelector('.swipe-content');
  swipeStartX = getClientX(e);
  swipeStartY = getClientY(e);
  isHorizontal = null;
  isSwiping = false;
  swipeContent.style.transition = 'none';
  
  longPressed = false;
  
  // check for long press of item
  longpressTimeout = setTimeout(() => {
    // --- LONG PRESS BOOKMARK LIST ---
    longPressed = true;
    addBookmarkMenuOverlay.dataset.songname = songname; // pass songname to the addBookmarkMenuOverlay.addEventListener
    addBookmarkMenuOverlay.style.display = "flex";  // show Add Bookmark Menu popup window
    // execution continues with the addBookmarkMenuOverlay.addEventListener click events
  }, 700); // longpress hold time
    
} // end onSwipeStart

// onSwipeMove
function onSwipeMove(e) {
  clearTimeout(longpressTimeout);   // clear longpress timeout
  const currentX = getClientX(e);
  const currentY = getClientY(e);
  const diffX = currentX - swipeStartX;
  const diffY = currentY - swipeStartY;

  // Determine horizontal or vertical swipe direction if not yet decided
  if (isHorizontal === null) {
    if (Math.abs(diffX) > Math.abs(diffY)) {
      isHorizontal = true;   // horizontal swipe → lock vertical scroll
      isSwiping = true;
    } else if (Math.abs(diffX) < Math.abs(diffY)) {
      isHorizontal = false;  // vertical scroll → lock horizontal swipe
    } else {
      return;
    }
  }
  
  if (isHorizontal) {
    e.preventDefault(); // prevent vertical scroll. MUST be before anything else
    // Horizontal swipe allowed (only left since if swiping right diffX is positive and the Math.min will return 0 to not do any translate)
    const translateX = Math.min(0, diffX);
    swipeContent.style.transform = `translateX(${translateX}px)`;
  } else {
    // Vertical scroll allowed → horizontal swipe disabled
    // by not doing the transform = translateX line
    // Do nothing, let browser do vertical scroll
  }
} // end onSwipeMove

// onSwipeEnd
function onSwipeEnd(e) {
  clearTimeout(longpressTimeout); // stop the longpressTimeout timer
  shortPressHandled = false;
  
  const item = swipeItem;
  const content = swipeContent;
  const currentX = getClientX(e);
  const diffX = currentX - swipeStartX;

  content.style.transition = 'transform 0.2s ease-out';

  // check for swipe distance
  if (isHorizontal && diffX < -swipeThreshold) {
    // Only delete if it was a horizontal swipe and greater than the threshold
    content.style.transform = 'translateX(-100%)';

    content.addEventListener('transitionend', function onSlide(ev) {
      if (ev.propertyName !== 'transform') return;
      content.removeEventListener('transitionend', onSlide);

      // Collapse outer <li>, i.e. animate shifting the items up
      item.classList.add('shrinking');
      item.addEventListener('transitionend', function onCollapse(ev2) {
        if (ev2.propertyName !== 'height') return;
        item.removeEventListener('transitionend', onCollapse);
        
        // Delete item from local storage
        const bookmarks = JSON.parse(localStorage.getItem(APP_NAME+"_bookmarks") || "{}");  // get bookmarks
        const mySongs = JSON.parse(localStorage.getItem(APP_NAME+"_MySongs") || '{}');      // get My Songs

        const folderItems = bookmarks[currentBookmarkFolder] || [];
        // Find the index of the item to remove
        // We use the dataset index we set in createBookmarkList
        const songNameToRemove = item.dataset.name; // save the song name
        const indexToRemove = parseInt(item.dataset.index); // save the index of song
        if (indexToRemove > -1) {
          folderItems.splice(indexToRemove, 1); // Remove from the array
          bookmarks[currentBookmarkFolder] = folderItems; // Update the folder
          localStorage.setItem(APP_NAME+"_bookmarks", JSON.stringify(bookmarks)); // Save back
        }
         
        // Update Swiper and slide to the next available song
        if (folderItems.length > 0) {
            // If we deleted the last song, indexToRemove is now out of bounds.
            // We adjust it to point to the new last song.
            let nextIndex = indexToRemove;
            if (nextIndex >= folderItems.length) {
                nextIndex = folderItems.length - 1;
            }
            // update currentListPages
            const newPageIndex = updateCurrentListPages(nextIndex, folderItems);
            // update swiper and slide to it in the background
            syncSwiper();
            swiper.slideTo(newPageIndex, 0);
            
        } else {
            // if the folder is now empty, then just clear the swiper
            currentListPages = [];
        }
        
        // Save the deleted item for undo
        lastDeletedItem = {
          item: item,
          parent: item.parentNode,
          nextSibling: item.nextSibling,
          name: songNameToRemove,
          index: indexToRemove,
          mysong: mySongs[songNameToRemove]  // save My Song
        };
        
        item.remove();      // remove item from DOM
        createBookmarkList(); // recreate the bookmark list
        
        // Remove My Song from local storage
        if (currentBookmarkFolder === "Folder 4") {
          // 1. Delete the actual image data
          delete mySongs[songNameToRemove];
          // 2. Look through ALL bookmark folders (Folder 1, 2, 3, etc.) to delete mysong from other bookmark folders
          Object.keys(bookmarks).forEach(folderName => {
            // We only need to check OTHER folders (Folder 4 is already handled)
            if (folderName !== "Folder 4") {
              //const originalLength = bookmarks[folderName].length;
              
              // Filter out the song name if it exists in this folder
              bookmarks[folderName] = bookmarks[folderName].filter(name => name !== songNameToRemove);
            }
          });
        }

        // Save updated bookmarks
        localStorage.setItem(APP_NAME+"_bookmarks", JSON.stringify(bookmarks)); // Save back
        // save updated My Songs
        localStorage.setItem(APP_NAME+"_MySongs", JSON.stringify(mySongs));
        
        showUndoToast(); // show toast for undo
      });
    }, { once: true });

  } else {
    // Snap back if not a horizontal swipe or not far enough
    content.style.transform = 'translateX(0)';
    
    const tapThreshold = 10;
      if (!longPressed && !isSwiping && !isBookmarkListScrolling && Math.abs(diffX) < tapThreshold) {  
      e.preventDefault();   // 🚫 block the synthetic click
      e.stopPropagation();  // 🚫 block bubbling
      if (!shortPressHandled) {
        // --- SHORT PRESS BOOKMARK LIST ---
        // item click detected. Display songsheet
        shortPressHandled = true;
        // 1. Retrieve the song name and index from the item's dataset
        const songname = swipeItem.dataset.name;  // same as item.dataset.name?
        const songindex = item.dataset.index;

        // 2. Retrieve the folderItems list from localStorage
        const bookmarks = JSON.parse(localStorage.getItem(APP_NAME+"_bookmarks") || "{}");
        const folderItems = bookmarks[currentBookmarkFolder] || [];

        // 3. update the global variable currentListPages and swiper, then display the song
        if (songname && folderItems.length > 0 && !isBookmarkListScrolling) {
          handleBookmarkSelect(songname, songindex, folderItems);
       }
        
      }
    }

  }

  // Reset gesture tracking
  swipeItem = null;
  swipeContent = null;
  isHorizontal = null;
  isSwiping = false;
} // end onSwipeEnd


/////////////////////////////////////////////////////////////////////////
///// Display the songsheet when a bookmark item is clicked
///// Updates the currentListPages global variable
// --- SHORT PRESS BOOKMARK LIST ---
function handleBookmarkSelect(songname, songindex, folderItems) {
  stopAudio();
  bookmarkListContainer.style.display = 'none';
  // update the currentListPages and get the pageIndex of song to display
  const pageIndex = updateCurrentListPages(songindex, folderItems);
  // display the song
  displaySong(songname, pageIndex);
}


/////////////////////////////////////////////////////////////////////////
// Bookmark List - Drag to reorder item stuff

// for auto scrolling the list when drag item to top or bottom
function autoScrollLoop() {
  if (autoScrollDirection !== 0) {
    const speed = 8; // px per frame, tweak for smoothness
    bookmarkList.scrollTop += autoScrollDirection * speed;
    autoScrollRAF = requestAnimationFrame(autoScrollLoop);
  }
}

// optional for enhance visual smooth slide when dragging
function animateReorder(firstRects) {
  const items = Array.from(bookmarkList.querySelectorAll('.swipe-item'))
                     .filter(el => el !== dragContent && el !== placeholder);

  items.forEach(el => {
    const first = firstRects.get(el);
    if (!first) return;

    const last = el.getBoundingClientRect();
    const dy = first.top - last.top;
    if (!dy) return;

    // Establish the inverted start state without animating…
    const prevTransition = el.style.transition;
    el.style.transition = 'none';
    el.style.transform = `translateY(${dy}px)`;

    // Force a reflow so the browser takes the inverted state as the start frame
    el.offsetHeight; // <- don't remove

    // Restore transition (so transform back to 0 animates), then go to final
    el.style.transition = prevTransition; // '' => use CSS rule with transform 180ms
    el.style.transform = '';
  });
}


let dragStartOffsetHold = 0; 

// onDragStart()
function onDragStart(e) {
  if (e.cancelable) e.preventDefault();
  dragContent = dragItem.closest('.swipe-item');
  if (!dragContent) return;

  const rect = dragContent.getBoundingClientRect();
  
  // 1. Capture where on the item the user grabbed (the offset from the top of the item)
  dragStartOffsetHold = getClientY(e) - rect.top;

  // 2. Placeholder setup
  placeholder = document.createElement('li');
  placeholder.className = 'swipe-item';
  placeholder.style.height = rect.height + 'px';
  dragContent.parentNode.insertBefore(placeholder, dragContent.nextSibling);

  // 3. Move to body
  document.body.appendChild(dragContent);

  // 4. Set fixed positioning to ignore page-level scrolling
  dragContent.style.position = 'fixed';
  dragContent.style.left = rect.left + 'px';
  dragContent.style.top = rect.top + 'px';
  dragContent.style.width = rect.width + 'px';
  dragContent.style.zIndex = '2000';
  dragContent.style.pointerEvents = 'none';
  dragContent.style.transition = 'none';

  window.addEventListener('touchmove', onDragMove, { passive: false });
  window.addEventListener('touchend', onDragEnd, { passive: false });
} // end onDragStart()

// onDragMove()
function onDragMove(e) {
  if (!dragContent) return;
  if (e.cancelable) e.preventDefault();

  const clientY = getClientY(e);
  const listRect = bookmarkList.getBoundingClientRect();

  // The top boundary is the top of the bookmarkList. 
  // We don't allow the item's top to go higher than the top of the bookmarkList listRect.top
  let newTop = clientY - dragStartOffsetHold;
  if (newTop < listRect.top) {
      newTop = listRect.top;
  }
  // -----------------------

  dragContent.style.top = newTop + 'px';

  // Autoscroll logic (only scroll when finger is near edges of the list)
  const edgeThreshold = 40;
  if (clientY < listRect.top + edgeThreshold) {
    autoScrollDirection = -1;
  } else if (clientY > listRect.bottom - edgeThreshold) {
    autoScrollDirection = 1;
  } else {
    autoScrollDirection = 0;
  }

  // Only start the auto scroll loop if it isn't already running
  if (autoScrollDirection !== 0 && !autoScrollRAF) {
    autoScrollRAF = requestAnimationFrame(autoScrollLoop);
  } else if (autoScrollDirection === 0 && autoScrollRAF) {
    // Stop the loop if we are no longer at an edge
    cancelAnimationFrame(autoScrollRAF);
    autoScrollRAF = null;
  }

  // Insertion Logic
  const children = Array.from(bookmarkList.querySelectorAll('.swipe-item'))
                        .filter(ch => ch !== dragContent && ch !== placeholder);

  let inserted = false;
  for (const child of children) {
    const r = child.getBoundingClientRect();
    // Use the middle of the child to determine swap point
    if (clientY < r.top + r.height / 2) {
      bookmarkList.insertBefore(placeholder, child);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    bookmarkList.appendChild(placeholder);
  }
} // end onDragMove()


// onDragEnd()
function onDragEnd(e) {
  if (!dragContent) return;

  // Stop autoscroll
  autoScrollDirection = 0;
  if (autoScrollRAF) {
    cancelAnimationFrame(autoScrollRAF);
    autoScrollRAF = null;
  }

  // 1. Physically move the item in the DOM to the placeholder's spot
  bookmarkList.insertBefore(dragContent, placeholder);

  // 2. SAVE THE NEW ORDER TO LOCAL STORAGE
  // We filter to ensure only items with a 'name' dataset are saved
  const listItems = Array.from(bookmarkList.querySelectorAll('.swipe-item'));
  const newOrder = listItems
    .map(li => li.dataset.name)
    .filter(name => name !== undefined && name !== null && name !== "null"); // <-- CRUCIAL FILTER

  // Load current bookmarks
  const bookmarks = JSON.parse(localStorage.getItem(APP_NAME+"_bookmarks") || "{}");
  
  // Update the current folder
  bookmarks[currentBookmarkFolder] = newOrder;
  
  // Save back to localStorage
  localStorage.setItem(APP_NAME+"_bookmarks", JSON.stringify(bookmarks));

  // 3. Reset styles
  dragContent.style.position = '';
  dragContent.style.left = '';
  dragContent.style.top = '';
  dragContent.style.width = '';
  dragContent.style.zIndex = '';
  dragContent.style.pointerEvents = '';
  dragContent.style.transition = '';

  // 4. Cleanup
  if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
  placeholder = null;
  dragContent = null;
  dragItem = null;

  // 5. Refresh the list to clean up DOM and indices
  createBookmarkList();
} // end onDragEnd()

    
/////////////////////////////////////////////////////////////////////////
// Bookmark List - Touch event listeners

// for detecting scrolling of bookmark list
let bookmarkListStartY = 0;
let isBookmarkListScrolling = false;

// Touch start event
bookmarkList.addEventListener('touchstart', (e) => {
  // for detecting scrolling of list
  bookmarkListStartY = e.touches[0].clientY;
  isBookmarkListScrolling = false;
  
  // 1. Check for press on Edit Pencil Icon
  const editBtn = e.target.closest('.edit-icon');
  if (editBtn) {
    //e.preventDefault();
    e.stopPropagation();
    //if (document.activeElement) document.activeElement.blur();  // force any existing focus to drop to prevent soft keyboard popup
    const songName = e.target.closest('.swipe-item').dataset.name;
    editExistingMySong(songName);
    return; // Exit early so swipe/drag don't start
  }
  
  // 2. Check for drag on Drag Handle icon
  dragItem = e.target.closest('.drag-handle');
  if (dragItem) {
    if (e.cancelable) e.preventDefault();   // block scroll right away
    e.stopPropagation();
    dragStartY = getClientY(e);
    onDragStart(e); // start drag immediately
    // make sure swipe is NOT initialized for this touch
    swipeItem = null;
    swipeContent = null;
    isHorizontal = null;
    return;
  }
  
  // 3. Check for swipe on item
  swipeItem = e.target.closest('.swipe-item');  // this will setup the swipe for the <li> item
  if (swipeItem) {
    const songname = swipeItem.dataset.name;  // get the songname from the list dataset
    onSwipeStart(e, songname);
  }
}, { passive: false }); // end touchstart event

// Touch move event
bookmarkList.addEventListener('touchmove', (e) => {
  // for detecting scrolling of list
  // If we move more than 10px vertically, it's a list scroll
  if (Math.abs(e.touches[0].clientY - bookmarkListStartY) > 10) {
    isBookmarkListScrolling = true;
  }
  
  if (dragContent) {
    if (e.cancelable) e.preventDefault();   // block scroll right away
    onDragMove(e);
    return;
  }
  
  // check for swipe move
  if (swipeContent) {
    onSwipeMove(e);
  }
  
}, { passive: false }); // end touchmove event

// Touch end event
bookmarkList.addEventListener('touchend', (e) => {
  if (dragContent) {
    onDragEnd(e);
    // fully reset swipe state so nothing tries to "delete"
    swipeItem = null;
    swipeContent = null;
    isHorizontal = null;
    return; // ← block swipe end
  }

  if (swipeItem && swipeContent) {  // swipe to delete ok but swipe up will display the song with this line
     onSwipeEnd(e);
  }
}); // end touchend event

bookmarkList.addEventListener('touchcancel', () => {
  clearTimeout(longpressTimeout);
});

/////////////////////////////////////////////////////////////////////////
// Bookmark List - Mouse event listeners
// Mouse down event
bookmarkList.addEventListener('mousedown', (e) => {
  // 1. Check for click on Edit Pencil Icon
  const editBtn = e.target.closest('.edit-icon');
  if (editBtn) {
    e.stopPropagation();
    const songName = e.target.closest('.swipe-item').dataset.name;
    editExistingMySong(songName);
    return; 
  }
  
  // 2. Check for drag on Drag Handle icon
  dragItem = e.target.closest('.drag-handle');
  if (dragItem) {
    e.preventDefault(); 
    e.stopPropagation();
    dragStartY = getClientY(e);
    onDragStart(e);

    // Attach global listeners so drag continues even if mouse leaves the list
    window.addEventListener('mousemove', onMouseDragMove);
    window.addEventListener('mouseup', onMouseDragEnd);
    return;
  }

  // 3. Check for swipe on item (Desktop swipe simulation)
  swipeItem = e.target.closest('.swipe-item');
  if (swipeItem) {
    const songname = swipeItem.dataset.name;  // get the songname from the list dataset
    onSwipeStart(e, songname);
    window.addEventListener('mousemove', onMouseSwipeMove);
    window.addEventListener('mouseup', onMouseSwipeEnd);
  }
});

// Helper: Global Mouse Drag Move
function onMouseDragMove(e) {
  if (dragContent) {
    onDragMove(e);
  }
}

// Helper: Global Mouse Drag End
function onMouseDragEnd(e) {
  if (dragContent) {
    onDragEnd(e);
  }
  // Clean up global listeners
  window.removeEventListener('mousemove', onMouseDragMove);
  window.removeEventListener('mouseup', onMouseDragEnd);
}

// Helper: Global Mouse Swipe Move
function onMouseSwipeMove(e) {
  if (swipeContent) {
    onSwipeMove(e);
  }
}

// Helper: Global Mouse Swipe End
function onMouseSwipeEnd(e) {
  if (swipeItem && swipeContent) {
    onSwipeEnd(e);
  }
  window.removeEventListener('mousemove', onMouseSwipeMove);
  window.removeEventListener('mouseup', onMouseSwipeEnd);
}
        
  
/////////////////////////////////////////////////////////////////////////
// Bookmark List - toast for undo delete
let toastTimeout = null;
function showUndoToast() {
  const toast = document.getElementById('undo-toast');
  toast.classList.add('show'); 
  
  // Clear any existing timer to prevent premature hiding
  if (toastTimeout) clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    lastDeletedItem = null;
  }, 3000);
}

// Restore item when UNDO button is clicked
document.getElementById('undoBtn').addEventListener('click', (e) => {
  // 1. Prevent this click from bubbling up to lists behind the toast
  e.stopPropagation();

  if (lastDeletedItem) {
    // 2. Update Local Storage Data first
    const bookmarks = JSON.parse(localStorage.getItem(APP_NAME+"_bookmarks") || "{}");
    const folderItems = bookmarks[currentBookmarkFolder] || [];
    
    // Insert the name back at the stored index
    folderItems.splice(lastDeletedItem.index, 0, lastDeletedItem.name);
    
    bookmarks[currentBookmarkFolder] = folderItems;
    localStorage.setItem(APP_NAME+"_bookmarks", JSON.stringify(bookmarks));

    // 3. Save My Song to local storage
    try {
      const mySongs = JSON.parse(localStorage.getItem(APP_NAME+"_MySongs") || '{}');
      mySongs[lastDeletedItem.name] = lastDeletedItem.mysong;
      localStorage.setItem(APP_NAME+"_MySongs", JSON.stringify(mySongs));
    } catch (error) {
      console.log("Error removing my songs from local storage");
    }

    // 4. Refresh the UI from the fresh data
    // This is safer than manual DOM insertion as it resets all data-index values correctly
    createBookmarkList();

    lastDeletedItem = null;
  }

  // 5. Hide Toast immediately
  clearTimeout(toastTimeout);
  document.getElementById('undo-toast').classList.remove('show');
});


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Search stuff
const navIcons = document.getElementById('nav-icons');
const searchBarContainer = document.getElementById('search-bar-container');
const searchInput = document.getElementById('searchInput');
const searchList = document.getElementById('searchList');

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  
  // Hide standard lists when searching
  numericList.style.display = 'none';
  numericListSidebar.style.display = 'none';
  alphabeticList.style.display = 'none';
  alphabeticListSidebar.style.display = 'none';
  bookmarkListContainer.style.display = 'none';

  if (query === "") {
    searchList.style.display = 'none';
    return;
  }

  // initialize currentListPages and currentListIndex
  const isNumeric = /^\d+$/.test(query);  // search for name or number?
  currentListPages = isNumeric ? NUMERIC_PAGES : ALPHABETIC_PAGES;  // set current list
  const currentListIndex = isNumeric ? NUMERIC_INDEX : ALPHABETIC_INDEX;
  const filteredSongs = currentListIndex.filter(title =>
    title.toLowerCase().includes(query)
  );

  renderSearchList(filteredSongs);
});

// Create the search list with the matching songs
function renderSearchList(songs) {
  searchList.innerHTML = '';
  searchList.style.display = 'block';
  
  adjustSearchListHeight(); // Adjust list height whenever results change

  if (songs.length === 0) {
    searchList.innerHTML = '<div style="padding:20px; color:#888; text-align:center;">未找到匹配的歌曲</div>'; // No matching songs found
    return;
  }
  // only one matching song so display it
  if (songs.length === 1) {
    const songname = songs[0];
    closeSearch();
    displaySong(songname, -1); // --- display the song. -1 for songindex means don't use the index
    return;
  }
  
  songs.forEach((songname) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.textContent = songname;

    attachListItemEventHandler(item, songname); // attached the touch and mouse event handlers for this song
    
    searchList.appendChild(item);         // add item to list
  });
} // end renderSearchList


function closeSearch() {
  searchInput.value = ''; // Clear search
  searchBarContainer.style.display = 'none';
  searchList.style.display = 'none';
  navIcons.style.display = 'flex';
}

// to adjust the searchList height to accomodate the soft keyboard that pops up
function adjustSearchListHeight() {
  if (searchList.style.display === 'none') return;

  // Use the Visual Viewport API to get the actual visible height
  const vv = window.visualViewport;
  const menuHeight = 60; // Your #menu-bar height
  
  // Calculate the distance from the top of the menu to the top of the keyboard
  // vv.height is the height of the area NOT covered by the keyboard
  // vv.offsetTop handles cases where the page might have zoomed
  const availableHeight = vv.height - (vv.offsetTop + menuHeight);

  searchList.style.height = `${availableHeight}px`;
}

// Listen for viewport changes (keyboard appearing/disappearing)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', adjustSearchListHeight);
  window.visualViewport.addEventListener('scroll', adjustSearchListHeight);
}


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Regular expression. Regex:
//    ^     beginning of string
//    $     end of string
//    +     one or more
//    *     zero or more
//    .     any single character
//    ^     not
//    \d    a digit
//    \d+   one or more digits
//    \s    a space
//    .*    everything
//    [^\s] or [^ ] not a space
//    [a-zA-Z]+   // one or more letters

//////////////////////////////////////////////////////////////////////////////////
//// Helper function to convert *_PAGES format "468h" to NUMERIC_INDEX format "468 A Child of the King"
function pages2Index(page) {
  const match = page.match(/^(\d+)/); // extract the number 486h
  const songnumber = match[1];
  const songname = NUMERIC_INDEX.find(title => title.startsWith(songnumber + " "));
  return songname;
}


//////////////////////////////////////////////////////////////////////////////////
//// Helper function to convert name format
// name format can be
//   5 赞美真神 or 赞美真神 5
//   "12 Joyful, Joyful, We Adore Thee",      (number at beginning)
//   "12 Joyful, Joyful, We Adore Thee2",     (number at beginning with page number at end)
//   "Joyful, Joyful, We Adore Thee 12"       (number at end with a space)  i.e., song number
//   or "Pass It On2"                         (number at end with NO space) i.e., page number
// change it to 
//   "12 Joyful, Joyful, We Adore Thee",      (number at beginning and no page number)
//// 5 赞美真神
function formatName(name) {
  let formattedName;
  // is there a song number at the beginning (digits) (space) (everything else)?
  if (name.match(/^(\d+)\s(.*)$/)) {  // yes there is a number at the beginning
    // remove the page number at the end if there is one (everything else)(no space)(digits)
    formattedName = name.replace(/\d+$/, ''); // remove the page number at the end
  } else {  // no number at the beginning
    if (!/ \d+$/.test(name) && /\d+$/.test(name)) { // is there a page number?
    // This block runs ONLY if there are digits at the end 
    // AND there is NOT a space before them.
      // remove the page number at the end if there is one (everything else)(no space)(digits)
      formattedName = name.replace(/\d+$/, ''); // remove the page number at the end
    } else {  // there's a song number at the end
      // move the song number at the end to the beginning
      // from (name) (space) (digits) to (digits) (space) (name)
      let match = name.match(/^(.*)\s(\d+)$/);
      formattedName = match ? `${match[2]} ${match[1]}` : name;
    }
  }
  return formattedName;
}


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//// Helper function to attach the touch and mouse event handlers for given song
// Called by NUMERIC_INDEX.forEach and ALPHABETIC_INDEX.forEach, and renderSearchList
function attachListItemEventHandler(item, songname) {
  // --- touch and mouse event handlers ---
  let longpressTimer = null;
  let isLongPress = false;
  let isScrolling = false;
  let startX = 0;
  let startY = 0;

  const startPress = (e) => {
    // Record starting position to check for movement "slop"
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    
    isLongPress = false;
    isScrolling = false;
    e.stopPropagation();

    longpressTimer = setTimeout(() => {
      // --- LONG PRESS INDEX LIST ---
      isLongPress = true;
      addBookmarkMenuOverlay.dataset.songname = songname; // pass songname to the addBookmarkMenuOverlay.addEventListener
      addBookmarkMenuOverlay.style.display = "flex";  // show Add Bookmark Menu popup window
      // execution continues with the addBookmarkMenuOverlay.addEventListener click events
    }, 700); // longpress hold time
  };

  const endPress = (e) => {
    clearTimeout(longpressTimer);
    if (!isLongPress && !isScrolling) {
      // --- SHORT PRESS INDEX LIST ---
      stopAudio();
      closeSearch();
      numericList.style.display = 'none';
      numericListSidebar.style.display = 'none';
      alphabeticList.style.display = 'none'; 
      alphabeticListSidebar.style.display = 'none';
      displaySong(songname, -1); // --- display the song
    }
    isLongPress = false;
    isScrolling = false;
  };

  const moveHandler = (e) => {
    if (!longpressTimer && !isScrolling) return;
    
    // Check if the finger moved more than 10px (the "slop")
    const touch = e.touches ? e.touches[0] : e;
    const moveX = Math.abs(touch.clientX - startX);
    const moveY = Math.abs(touch.clientY - startY);
    
    // If we move more than 10px, it's a scroll/swipe, not a tap
    if (moveX > 10 || moveY > 10) {
      isScrolling = true; // Mark as scrolling
      clearTimeout(longpressTimer);
      longpressTimer = null;
    }
  };

  const cancelPress = () => {
    clearTimeout(longpressTimer);
    longpressTimer = null;
    isLongPress = false;
    isScrolling = false;
  };

  // --- bindings ---
  item.addEventListener('contextmenu', (e) => e.preventDefault());

  // Touch
  // use passive: false to disable system from handling the touches
  // We will handle the touches in startPress and endPress
  item.addEventListener('touchstart', startPress, { passive: false });
  item.addEventListener('touchend', endPress, { passive: false });
  item.addEventListener('touchmove', moveHandler, { passive: false });
  item.addEventListener('touchcancel', cancelPress, { passive: false });

  // Mouse
  item.addEventListener('mousedown', startPress);
  item.addEventListener('mouseup', endPress);
  item.addEventListener('mouseleave', cancelPress);  
}


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Music Player stuff
const audio = document.getElementById("audio");
const playBtn = document.getElementById("btnPlay");
const pauseBtn = document.getElementById("btnPause");
const stopBtn = document.getElementById("btnStop");
const progressBar = document.getElementById("progressBar");
const elapsedTime = document.getElementById("elapsed");
const remainingTime = document.getElementById("remaining");
const audioFilename = document.getElementById("audioFilename");

let playing = false;

// Format time from seconds to MM:SS
function formatTime(seconds) {
  seconds = Math.floor(seconds);
  let m = Math.floor(seconds / 60);
  let s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Update time display and progress bar
function updateTimeDisplay() {
  if (audio.duration) {
    elapsedTime.textContent = formatTime(audio.currentTime);
    remainingTime.textContent = formatTime(audio.duration - audio.currentTime);
    progressBar.max = audio.duration;
    progressBar.value = audio.currentTime;
  } else {
    elapsedTime.textContent = "0:00";
    remainingTime.textContent = "0:00";
    progressBar.max = 100;
    progressBar.value = 0;
  }
}

// Display the Music Player popup
function openMusicPlayer() {
  document.getElementById('musicPlayerOverlay').classList.add('show');
  
  // get filename
  let filename = currentListPages[swiper.activeIndex];
  // remove the page number from the end of the name, e.g. the 2 from Serenade - Liszt2
  filename = filename.replace(/\d+$/, ''); // remove the page number at the end
  
  if (!playing) {
    audio.src = "audios/"+filename+".mp3"; // Set the audio source when popup opens
    audio.load(); // Ensure the audio is ready for playback

    // Disable the controls initially
    playBtn.disabled = true;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    progressBar.disabled = true;
    audioFilename.textContent = "Loading...";
    
    // Check if the file exists (after loading data)
    audio.onloadeddata = () => {
      const songname = pages2Index(filename);   // convert *_PAGES format "468h" to NUMERIC_INDEX format "468 A Child of the King"
      audioFilename.textContent = songname;  // Display the song name
      updateTimeDisplay();  // Show the initial time remaining
      playBtn.disabled = false;
    };

    // If the file can't be loaded, show error
    audio.onerror = () => {
      audioFilename.textContent = "没有音频文件";  // No audio file
    };

  }
}


function closeMusicPlayer() {
  document.getElementById('musicPlayerOverlay').classList.remove('show');
}

// Detect Esc key to close the Music Player popup
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeMusicPlayer();
});

function playAudio() {
  audio.play();
  playBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
  progressBar.disabled = false;
  playing = true;
}

function pauseAudio() {
  audio.pause();
  playBtn.disabled = false;
  pauseBtn.disabled = true;
}

function stopAudio() {
  audio.pause();
  audio.currentTime = 0;
  const audioFilename = document.getElementById("audioFilename");
  if (audioFilename.textContent === "没有音频文件") {  // No audio file
    playBtn.disabled = true;
  } else {
    playBtn.disabled = false;
  }
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  progressBar.disabled = true;
  updateTimeDisplay();
  playing = false;
}
/*
audio.addEventListener("loadeddata", () => {
});

audio.addEventListener("loadedmetadata", () => {
  updateTimeDisplay();
});

audio.addEventListener("error", () => {
  console.warn("Audio file not found or cannot be loaded.");
});
*/


audio.addEventListener("timeupdate", () => {
  updateTimeDisplay();
});

progressBar.addEventListener("input", () => {
  audio.currentTime = progressBar.value;
});

// triggers when song has ended
audio.addEventListener("ended", () => {
  stopAudio();
});


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Import My Songs stuff

//////////////////////////////////////////////////////////////////////////////////
// Show the Import My Songs popup
function openImportMySongs() {
  document.getElementById('importMySongsOverlay').classList.add('show');  // open the popup
  //const inputFileName = document.getElementById('inputFileName');
  //inputFileName.value = '';
  //inputFileName.blur();     // force the browser to drop any focus
  //inputFileName.focus();    // set focus to the input field
  const fileRadio = document.querySelector('input[name="importSource"][value="file"]');
  fileRadio.checked = true;
  
  // execution continues with the goImportMySongs()
}

// this is called when a radio button is pressed
function handleImportMySongsRadioButtonChange(radio) {
  const selectedSource = radio.value; // This will be 'file' or 'camera'
  //const inputFileName = document.getElementById('inputFileName');
  if (selectedSource === 'file') {
    //inputFileName.placeholder = "Enter file name (optional)";
    // You could show a "Choose File" button here if needed
  } else if (selectedSource === 'camera') {
    //inputFileName.placeholder = "Enter file name (required)";
    // You could prepare the camera stream here
  }
}

// This is called when the CANCEL button in Import My Songs is pressed
// Close the Import My Songs popup
function closeImportMySongs() {
  document.getElementById('importMySongsOverlay').classList.remove('show');
}

// This is called when the GO button in Import My Songs is pressed
function goImportMySongs() {
  // this is the hidden input field hiddenFileInput for triggering the file picker or camera
  const fileInput = document.getElementById('hiddenFileInput');
  const importSource = document.querySelector('input[name="importSource"]:checked').value;

  if (importSource === 'file') {
    // open the file picker
    fileInput.removeAttribute('capture');
    fileInput.setAttribute('accept', '.jpg, .jpeg, .png'); // Set your allowed types

  } else {
    // open the camera
    fileInput.setAttribute('accept', 'image/*');
    fileInput.setAttribute('capture', 'environment'); // rear camera. Use capture="user" for front camera 
  }
  
  // Programmatically click the hidden input hiddenFileInput to open the file picker
  fileInput.click();
  
  // execution continues with the handleFileSelect()
}


// This runs after the user selects one or more files from the file picker or takes a photo
// It is called from html input for id="hiddenFileInput" onchange="handleFileSelect"
async function handleFileSelect(input) {
  if (input.files && input.files.length > 0) {  // check if there's actually a file selected
    closeImportMySongs(); // Close popup after selection

    // show the spinner
    const preview = document.getElementById('imagePreview');
    const spinner = document.getElementById('loadingSpinner');
    preview.style.display = 'none';
    spinner.style.display = 'block';

    // user selected just one or multiple files?
    if (input.files.length > 1) {
      // MULTIPLE FILES BATCH MODE: Save directly
      /*
      // show the spinner
      // 1. Show the Edit overlay (where the spinner lives)
      document.getElementById('editMySongsOverlay').classList.add('show');
      
      // 2. Hide the file input/fields and show only the spinner
      document.getElementById('imagePreview').style.display = 'none';
      document.getElementById('inputFileName').parentElement.style.display = 'none'; // Hide "File name:" text
      const spinner = document.getElementById('loadingSpinner');
      spinner.style.display = 'block';

      // 3. Use setTimeout to allow the UI to actually render the spinner
      // before the heavy "saveFilesDirectly" loop starts.
      setTimeout(async () => {
        await saveMultipleFiles(input.files);
        
        // 4. Clean up: Restore the Edit popup's original state for next time
        document.getElementById('inputFileName').parentElement.style.display = 'block';
      }, 100);
      */
      
      // close the popup
      closeEditMySongs();
      selectFolder(4);

      showToast(`正在導入${input.files.length}首歌曲...`);  // Importing n songs...
      await saveMultipleFiles(input.files);
      
      // execution continues with the saveMultipleFiles()
      
    } else {
      // SINGLE FILE MODE: Show Edit My Songs Popup
      // show the spinner
      const preview = document.getElementById('imagePreview');
      const spinner = document.getElementById('loadingSpinner');
      preview.style.display = 'none';
      spinner.style.display = 'block';
      
      //setTimeout(() => {  // a slight delay before opening popup to prevent browser flickers
          openEditMySongs(input);
          
          // execution continues with the openEditMySongs()
      //}, 50);
    }
  }
  
  // IMPORTANT. Need to reset the input value to clear the browser cache
  // otherwise handleFileSelect doesn't get called if the same file(s) are selected immediately the second time
  input.value = "";
}


//////////////////////////////////////////////////////////////////////////////////
// Show the Edit My Songs popup
let originalEditName = ""; // Tracks the name before any user edits for renaming

// this function is called from handleFileSelect, AFTER user selects a file or takes a photo
function openEditMySongs(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const name = file.name.replace(/\.[^/.]+$/, "");
    const sizeText = file.size > 1048576 
        ? (file.size / 1048576).toFixed(2) + " MB" 
        : (file.size / 1024).toFixed(1) + " KB";

    const reader = new FileReader();
    reader.onload = (e) => populateEditMySongs(name, e.target.result, sizeText);
    reader.readAsDataURL(file);
    
    // execution continues with the populateEditMySongs()
  }
}

// this function is called when the Edit pencil icon is clicked
function editExistingMySong(songName) {
  const mySongs = JSON.parse(localStorage.getItem(APP_NAME + "_MySongs") || '{}');
  const songData = mySongs[songName];
  if (!songData) return;

  // Calculate size from Base64 string
  const stringLength = songData.split(',')[1].length;
  const sizeInKb = (Math.floor(stringLength * 0.75) / 1024).toFixed(1);

  populateEditMySongs(songName, songData, sizeInKb + " KB");

  // execution continues with the populateEditMySongs()
}

// fills in the data in the Edit My Songs popup
function populateEditMySongs(name, imageData, sizeText) {
    originalEditName = name;  // store the name to check for renames later

    // 1. Set text fields
    const inputFileName = document.getElementById('inputFileName');
    inputFileName.value = name;
    document.getElementById('displayFileSize').innerText = sizeText;

    // 2. Update the page number field from the input name
    updatePageNumberFromInput(name);
    
    // 3. Set Image
    const preview = document.getElementById('imagePreview');
    preview.src = imageData;
    preview.style.display = 'block';
    preview.style.transition = 'none';      // Disable animation
    preview.style.transform = 'rotate(0deg)'; // Reset rotation
    currentImageRotation = 0;

    // Force a reflow to ensure the 'none' takes effect before we re-enable transitions
    void preview.offsetWidth; 
    preview.style.transition = 'transform 0.2s ease-in-out'; // Re-enable rotate animation for the rotate icons. NEED to match the style in CSS
    //transition: transform 0.2s ease-in-out, width 0.2s, height 0.2s;  /* this makes the rotation smooth taking 0.2 seconds */
    
    // 4. turn off spinner
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = 'none';

    // 5. Show Popup and Focus
    document.getElementById('editMySongsOverlay').classList.add('show');
    //inputFileName.focus();  // show soft keyboard
    //inputFileName.select();
}

// this is called from populateEditMySongs AND html
function updatePageNumberFromInput(name) {
  const pageDisplay = document.getElementById('displayPageNumber');
  // Finds digits at the end of the string
  const match = name.match(/(\d+)$/);  
  // Update the page number
  pageDisplay.innerText = match ? match[1] : "1";
  
}

// This is called when the DONE button in Edit My Songs popup is pressed
function doneEditMySongs() {
  const filename = document.getElementById('inputFileName').value.trim().replace(/\s+(?=\d+$)/, '');
  const imageElement = document.getElementById('imagePreview');

  if (!filename || !imageElement.src) return;

  const compressedData = compressImage(imageElement); 
  
  try {
    // 1. Check if filename already exists in My Songs
    const mySongs = JSON.parse(localStorage.getItem(APP_NAME + "_MySongs") || '{}');
    if (mySongs[filename] && filename !== originalEditName) {
      showToast("名称已存在。请选择其他名称。");  // Name already exists. Please choose a different name
      return; // Don't save
    }
    
    // 2. Update My Songs bookmark
    const bookmarks = JSON.parse(localStorage.getItem(APP_NAME + "_bookmarks") || "{}");

    // 3. Is it a Rename?
    if (originalEditName && originalEditName !== filename) {
      // Remove old image data
      delete mySongs[originalEditName];
      
      //  Loop through EVERY folder in bookmarks (Folder 1, 2, 3, 4, etc.)
      Object.keys(bookmarks).forEach(folderKey => {
        let currentFolder = bookmarks[folderKey];
        // Find the index of the old name in this specific folder
        const oldIndex = currentFolder.indexOf(originalEditName);
        if (oldIndex !== -1) {
          // Replace the old name with the new name at the exact same position
          currentFolder[oldIndex] = filename;
        }
      });

    }

    // 4. Add the new filename to folder4
    if (!bookmarks["Folder 4"]) { // if Folder 4 doesn't exist, create it as an empty array
      bookmarks["Folder 4"] = [];
    }
    if (!bookmarks["Folder 4"].includes(filename)) {
      bookmarks["Folder 4"].push(filename);
    }

    // 5. Save updated folder4 bookmarks
    localStorage.setItem(APP_NAME + "_bookmarks", JSON.stringify(bookmarks));

    // 6. Save the compressed new image data
    mySongs[filename] = compressedData;
    localStorage.setItem(APP_NAME + "_MySongs", JSON.stringify(mySongs));
      
  } catch (error) {
    console.warn("storage is full ",error);
    showToast("存储空间已满"); // Storage is full
    return; 
  }

  closeEditMySongs();
  
  // Re-fetch to ensure we have the latest state for the UI update
  const updatedBookmarks = JSON.parse(localStorage.getItem(APP_NAME + "_bookmarks") || "{}");
  const folderItems = updatedBookmarks["Folder 4"] || [];

  if (folderItems.length > 0) {
    // Find the correct index of the song we just saved
    const currentSongIndex = folderItems.indexOf(filename); 
    const finalIndex = currentSongIndex !== -1 ? currentSongIndex : folderItems.length - 1;
    // Rebuild swiper and show the song
    handleBookmarkSelect(filename, finalIndex, folderItems);
    selectFolder(4);
  }
} // end doneEditMySongs


// This is called when the CANCEL button in Edit My Songs is pressed
// Close the Edit My Songs popup
function closeEditMySongs() {
  document.getElementById('editMySongsOverlay').classList.remove('show');
}

// this is called when user selects multiple files to save all of them to local storage
async function saveMultipleFiles(files) {
  let mySongs = JSON.parse(localStorage.getItem(APP_NAME + "_MySongs") || '{}');
  const fileArray = Array.from(files);
//  const spinnerPara = document.querySelector('#loadingSpinner p'); // The "Processing..." text
  
  for (const file of fileArray) {
//  for (let i = 0; i < fileArray.length; i++) {
//    const file = fileArray[i];
//    if (spinnerPara) {  // show and update spinner text
//      spinnerPara.innerText = `Processing Page ${i + 1} of ${fileArray.length}...`;
//    }
    const originalName = file.name.replace(/\.[^/.]+$/, "");
    try {
      const img = await fileToImage(file);  // Load file into a temporary Image object (not the DOM)
      const compressedData = compressImage(img);  // Compress the image
      mySongs[originalName] = compressedData;     // Store the image
      saveBookmark(originalName, "Folder 4");     // add to bookmark list
      
    } catch (err) {
      console.error("Failed to import:", file.name, err);
    }
  }

  try {
    // save My Songs to local storage
    localStorage.setItem(APP_NAME + "_MySongs", JSON.stringify(mySongs));
    // sync the swiper with the updated My Songs (Folder 4)
    const bookmarks = JSON.parse(localStorage.getItem(APP_NAME + "_bookmarks") || "{}");
    const folderItems = bookmarks["Folder 4"] || [];
    
    if (folderItems.length > 0) {
      const lastIndex = folderItems.length - 1; // point to the very last song added
      //const lastSongName = folderItems[lastIndex];
      updateCurrentListPages(lastIndex, folderItems);  // update the global currentListPages
      // update swiper and slide to it in the background
      syncSwiper();
      swiper.slideTo(lastIndex, 0);
    }        
    showToast(`${fileArray.length} 歌曲已导入“我的歌曲”`);  // songs imported to My Songs
  } catch (e) {
    showToast("存储空间已满"); // Storage is full
  }
}


// Converts a File object (from input.files) into an HTMLImageElement
// This is required so the Canvas can "draw" the image for compression
// This is called from saveMultipleFiles()
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img); // Image is loaded and ready for canvas
      img.onerror = reject;           // Handle broken or invalid images
      img.src = e.target.result;      // This is the base64 dataURL
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Rotate the image by the given degrees
let currentImageRotation = 0;

// this is called from html
function rotateImage(degrees) {
  currentImageRotation = (currentImageRotation + degrees) % 360;
  
  const img = document.getElementById('imagePreview');
  const container = img.parentElement; // Assumes a container div holds the image
  
  img.style.transform = `rotate(${currentImageRotation}deg)`;

  // If rotation is 90 or 270, the image is "sideways"
  if (Math.abs(currentImageRotation) % 180 !== 0) {
    // For vertical orientation, we need to ensure the image 
    // fits by swapping how we treat the container's space
    img.style.maxWidth = 'none'; 
    // You might need to adjust the container height here 
    // depending on your CSS layout
  } else {
    img.style.maxWidth = '100%';
  }
}

// this is called from html
async function resizeImage() {
    const imgElement = document.getElementById('imagePreview');
    const sizeDisplay = document.getElementById('displayFileSize');

    // 1. Compress image using the currentImageRotation and MAX_WIDTH (800px)
    const compressedData = compressImage(imgElement);

    // 2. Update the preview with the new, smaller version
    imgElement.src = compressedData;

    // 3. Calculate the new size to show the user the result
    // (Base64 strings are ~33% larger than binary, so we multiply by 0.75 for accuracy)
    const stringLength = compressedData.split(',')[1].length;
    const sizeInBytes = Math.floor(stringLength * 0.75);
    const sizeInKb = (sizeInBytes / 1024).toFixed(1);

    sizeDisplay.innerText = sizeInKb + " KB";
}

// Compress the image
function compressImage(imgElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Detect if we are sideways
  const isSideways = Math.abs(currentImageRotation) % 180 !== 0;
  
  // SWAP dimensions for the canvas if sideways
  const width = isSideways ? imgElement.naturalHeight : imgElement.naturalWidth;
  const height = isSideways ? imgElement.naturalWidth : imgElement.naturalHeight;
  
  // Set canvas size to the NEW dimensions
  canvas.width = width;
  canvas.height = height;

  // Move registration point to the center to rotate
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((currentImageRotation * Math.PI) / 180);
  
  // Draw the image (using natural dimensions)
  ctx.drawImage(imgElement, -imgElement.naturalWidth / 2, -imgElement.naturalHeight / 2);

  return canvas.toDataURL('image/jpeg', 0.7);
}

// Handle the Go/Enter key press on the soft keyboard
// will call the doneEditMySongs
function handleEditKeydown(event) {
  // Check for the "Go/Enter" key (key code 13 or key "Enter")
  if (event.key === "Enter" || event.keyCode === 13) {    
    event.preventDefault(); // Prevent the default behavior (like refreshing the page or moving to next field)
    doneEditMySongs();    // Trigger the same logic as the DONE button
    event.target.blur();  // Force the keyboard to close
  }
}


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Toast message at bottom stuff
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "show";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 2500); // hide after 2.5s
}


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Wake Lock to prevent device from going to sleep
let wakeLock = null;

const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {  // Check if the browser supports the API
    try {
      // Request a screen wake lock
      wakeLock = await navigator.wakeLock.request('screen');
      
      // Listen for the release event
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock was released');
      });
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  } else {
    console.warn("Wake Lock API not supported in this browser.");
  }
};


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Service Worker stuff
// This is the UI to notify user of new updates
let updateAlert = false;
function revealUpdateMenuItem() {
  const updateItem = document.getElementById('updateMenuItem');
  if (updateItem) {
    updateItem.style.display = 'flex'; // Use flex to match your other items
    updateAlert = true;
    console.log("SW 4:Notify user of new updates");
    
    // Show update alert
    setTimeout(() => {
      showToast("有新更新可用"); // New updates available
    }, 500); // 500ms is usually enough to clear background throttling
  }
}


let newWorker;

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("sw.js");  // register the service worker
      console.log("SW 0:Service Worker registered with scope:", reg.scope);

      // If there's a service worker already waiting then notify user of a new update
      if (reg.waiting) {
        console.log("SW :waiting");
        newWorker = reg.waiting;
        revealUpdateMenuItem();
      }

      // If there's a new service worker update found then notify user of a new update
      reg.addEventListener('updatefound', () => {
        console.log("SW 2:New updates found");
        newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log("SW 3:New updates downloaded and ready to install");
            revealUpdateMenuItem();
          }
        }); // end addEventListener statechange        
      }); // end addEventListener updatefound
      
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    } // end catch

    // refresh index.html after SW updated
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return;
      console.log("SW 6:App updated - refreshing page");
      // the time delay is only for debugging to see the console log
      setTimeout(adjustSearchListHeight, 3000);  
      window.location.reload();
      refreshing = true;
    });

    } // end if ('serviceWorker' in navigator)
}

registerServiceWorker();  // start the Service Worker

// Check for service worker updates every so often
setInterval(() => {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (reg) {
      console.log("SW 1:Checking for service worker updates");
      reg.update();  // step 1
    }
  });
//}, 24 * 60 * 60 * 1000); // every 24 hours
//}, 1 * 60 * 60 * 1000);  // every 1 hour
}, 15 * 1000);           // every 15 seconds