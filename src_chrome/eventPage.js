/*
 * Called when the user clicks on the browser action icon.
 *
 * it invokes the updateBookmarkFromTab function on currently active tab and
 * the root of the bookmark hierarchy.
 *
 * See also:
 * onClicked Broweser Action: 
 * http://developer.chrome.com/extensions/browserAction.html#event-onClicked
 */
chrome.browserAction.onClicked.addListener(function(tab){

  chrome.bookmarks.getTree(function(bookmarkTreeNodes){
    updateBookmarkFromTab(tab,bookmarkTreeNodes);
  });
});

/* update the closest matching bookmark to point to a tab.
 *
 * the given bookmarktree is scanned for bookmarks with url's that match with
 * the url of the given tab. The url of bookmark that is the closest match
 * will be set to the url of the tab.
 *
 *
 * @param {Tab} tab The tab that should be bookmarked by updating the closest
 * matching existing bookmark.
 *
 * @param {BookmarkTreeNode} bookmarkTreeNode The root of the bookmark tree that
 * will be scanned for bookmarks that match the given tab.
 *
 * @return Returns nothing.
 *
 * see also:
 *  Tab: http://developer.chrome.com/extensions/tabs.html#type-Tab
 *  BookmarkTreeNode: http://developer.chrome.com/extensions/bookmarks.html#type-BookmarkTreeNode
 */
function updateBookmarkFromTab(tab,bookmarkTreeNode){

  // search for a matching bookmark on the same domain
  console.log('%s','Stage 1: scan for best matching bookmark with same domain');
  var iterator = new DomainBookmarkIterator(tab.url, bookmarkTreeNode);
  var results = findBestMatch(iterator,tab);

  // fall back to matching all bookmarks if there is no match on the same domain
  if(results.matchingBookmarkList.length == 0){
    console.log('%s','         No matching bookmarks found');
    console.log('%s','Stage 2: scan whole bookmark tree for best matching bookmark');
    var iterator = new BookmarkIterator(bookmarkTreeNode);
    results = findBestMatch(iterator,tab);
  }

  // process match results
  if (results.matchScore < 10){
    alert("Could not find any bookmark that shares at least 10 characters!");
  }
  else if (results.matchingBookmarkList.length == 1){
      var title = results.matchingBookmarkList[0].title;
      var oldUrl = results.matchingBookmarkList[0].url;
      var newUrl = tab.url;

      chrome.bookmarks.update(
          String(results.matchingBookmarkList[0].id),
          { url : newUrl },
          function callback(updatedBookmark){
            //log  action
            console.group('update bookmarkTreeNode');
            console.log('updating bookmark "%s"',  results.matchingBookmarkList[0].title);
            console.log('%O',results.matchingBookmarkList[0]);
            console.log('from')
            console.log('  %s', oldUrl)
            console.log("to");
            console.log('  %s', newUrl);
            console.log('%O', updatedBookmark);
            console.groupEnd();

            //present undo notification
            showUndoNotification(updatedBookmark, oldUrl);
          }
      );
  } else {
      var nodeList = "";
      for ( var h = 0; h < results.matchingBookmarkList.length; h++)
        nodeList = nodeList + "  "
            + results.matchingBookmarkList[h].url
            + "\n";

      alert("Could not find a unique closest bookmark. Found "
          + results.matchingBookmarkList.length
          + " closest bookmarks with " + results.matchScore + " matches :\n"
          + nodeList);
      //log  action
      console.group('Non-unique best matches');
      console.log(tab.url);
      console.log('Number of matching characters: %i',results.matchScore);
      for(var h=0; h< results.matchingBookmarkList.length; h++){
        console.log("%s",results.matchingBookmarkList[h].url);
      }
      console.groupEnd();
  }

}

/* find the best matching bookmark compared to the current tab.
 *
 * The matching algorithm used is the one configured by the user in the options
 * page.
 *
 * @param {BookmarkIterator} An iterator of bookmarks that are to be
 * matched with the given tab
 *
 * @param {Tab} tab The tab that should be mathed against
 *
 * @return {matchScore, matchingBookmarkList} t match results object with two
 * properties. The number of matching characters, i.e. the matchScore and a
 * list of bookmarks corresponding the matchScore
 *
 */
function findBestMatch(iterator,tab){
  var maxMatchingChars = -1;
  var closestBookmarkList = new Array();

  var node = iterator.next();
  while(node){
    var numMatchingChars = 0;
    /*
     * compute number of matching characters using the matching algorithm
     * selected by the user in the options page.
     *
     * default to matchPrefix if no algorithms has been set yet 
     */
    var matchAlgorithm = localStorage.matchAlgorithm;
    if( matchAlgorithm == undefined) { matchAlgorithm = "matchPrefix"}
    switch (matchAlgorithm){
      case "matchPrefix":
        // default to the matchPrefix routine.
        numMatchingChars = matchPrefix(node.url,tab.url);
        break;
      case "matchTillEnd":
        numMatchingChars = matchTillEnd(node.url,tab.url);
        break;
      case "fuzzyMatch":
        numMatchingChars = fuzzyMatch(node.url, tab.url);
        break;
      default:
        console.error('The configured matching algorithm "%s" doesn\'t exists',
                    matchAlgorithm);
    }

    if (numMatchingChars > maxMatchingChars)
    {
      closestBookmarkList = new Array();
      maxMatchingChars = numMatchingChars;
    }
    if (numMatchingChars >= maxMatchingChars)
    {
      closestBookmarkList.push(node);
    }

    node = iterator.next();
  }
  return { matchScore: maxMatchingChars,
           matchingBookmarkList: closestBookmarkList};
}

/* Construct an iterator object that iterates over for all bookmarks.
 *
 *
 * @param {BookmarkTreeNode Array} bookmarkNodes an array of BookmarkTreeNode
 * objects that serve as the roots of the bookmark trees that this iterator will
 * operate on.
 *
 * successive invocations of the next() method will iteratively return
 * bookmarks. When a null is returned that the iterator has been depleted.
 *
 */
function BookmarkIterator(bookmarkNodes){
  // an  array of unvisited bookmark folders.
  this.folderList = new Array();

  // the array of children of the current folder
  this.currentChildren = bookmarkNodes;

  // index into this.currentChildren of child to return on the following invocation of next();
  this.currentChildIndex = 0;


  this.next = function(){
    if(this.currentChildIndex < this.currentChildren.length){
      var child = this.currentChildren[this.currentChildIndex];
      this.currentChildIndex ++;
      if(child.url){
        return child;
      }else{
        this.folderList.push(child)
        return this.next();
      }
    }else{
      if(this.folderList.length >0){
        var folder = this.folderList.pop();
        this.currentChildIndex = 0;
        this.currentChildren = folder.children;
        return this.next();

      } else{
        return null;
      }

    }
  }
}

/*
 * Construct an iterator that iterates over all bookmarks on a given domain.
 *
 * A domain is identified by an url and a bookmark is on that domain if the
 * extractDomainName() function is identical for both.
 *
 * @param {String} domainName url of the domain of interest.
 *
 * @param {BookmarkTreeNode Array} bookmarkNodes an Array of BookmarkTreeNode
 * objects that serve as the roots of the bookmark trees that this iterator will
 * operate on.
 *
 * successive invocations of the next() method will iteratively return
 * bookmarks. When a null is returned that the iterator has been depleted.
 *
 */
function DomainBookmarkIterator(domainName, bookmarkNodes){
  this.domainName = extractDomainName(domainName);
  this.bookmarkIt = new BookmarkIterator(bookmarkNodes);

  this.next = function(){
    var bookmark = this.bookmarkIt.next();
    while(bookmark){
      if( this.domainName == extractDomainName(bookmark.url)){
        return bookmark;
      }
      bookmark = this.bookmarkIt.next();
    }
    return null;
  }
}

/* Match two string with each other.
 *
 * Both string are compared character by character starting from the first one.
 * The comparison stops the moment a character differs.
 *
 * @param {string} string1
 * @param {string} string2
 *
 * @return {int} Returns the number of initial characters of both strings that
 * are equal.
 *
 */
function matchPrefix(string1, string2){
  var numMatchingChars = 0;
  for ( var j = 1; j < string1.length
      && j < string2.length; j++)
  {
    if (string1.substr(0, j) == string2.substr(0, j))
      numMatchingChars = j;
    else
      break;
  }
  return numMatchingChars;
}


/* Match two string with each other.
 *
 * Both string are compared character by character starting from the first one.
 * till the end of the shortest string. Different characters are skipped.
 *
 * @param {string} string1
 * @param {string} string2
 *
 * @return {int} Returns the number of matching characters
 *
 */
function matchTillEnd(string1, string2){
  var numMatchingChars = 0;
  var i1 = 0;
  var i2 = 0;
  while( i1 < string1.length && i2 < string2.length){
    if (string1[i1] == string2[i2]){
      numMatchingChars++;
    }
    i1++;
    i2++;
  }
  return numMatchingChars;
}

/* Fuzzy character matching algorithm inspired by the Levenshtein Distance
 *
 * there exists a transformation that would transform string 1 into string 2 by
 * sequentially applying one of the following 4 operations on the characters of string 1:
 *   + matching: leave a character unchanged,
 *   + substitution: substitute a character with a different one,
 *   + addition: add a new character
 *   + deletion: remove a character
 * This transformation is however not unique. The trivial transformation would
 * for example delete all characters of string 1 and then add those of string
 * 2.
 *
 * This recursive algorithm will implicitly construct the transformation from
 * string 1 to string 2 that maximizes the number of matching operations and
 * count them.
 *
 * @param {String} str1 string 1
 * @param {String} str2 string 2
 *
 * @return {int} The number of matching characters between string 1 and string
 * 2 while allowing character substitution, addition and deletion.
 */
function fuzzyMatch(str1, str2){
  var cache = {length:0}; // empty cache
  return cachedFuzzyMatch(str1, str2, cache);
}

/* cached recursive Fuzzy character matching algorithm inspired by the Levenshtein Distance
 *
 * there exists a transformation that would transform string 1 into string 2 by
 * sequentially applying one of the following 4 operations on the characters of string 1:
 *   + matching: leave a character unchanged,
 *   + substitution: substitute a character with a different one,
 *   + addition: add a new character
 *   + deletion: remove a character
 * This transformation is however not unique. The trivial transformation would
 * for example delete all characters of string 1 and then add those of string
 * 2.
 *
 * This recursive algorithm will implicitly construct the transformation from
 * string 1 to string 2 that maximizes the number of matching operations and
 * count them.
 *
 * @param {String} str1 string 1
 * @param {String} str2 string 2
 *
 * @return {int} The number of matching characters between string 1 and string
 * 2 while allowing character substitution, addition and deletion.
 */
function cachedFuzzyMatch(str1, str2,cache){
    var key = [str1,str2].join(',');
    if(cache[key] != undefined)  return cache[key];

    // trivial solutions
    if(str1.length == 0) return 0;
    if(str2.length == 0) return 0;
    if(str1 == str2) return str1.length;

    var match = 0;
    // recursive call based on first character
    if(str1[0] == str2[0]){
        match = 1 + cachedFuzzyMatch(str1.substr(1),str2.substr(1),cache);
    } else{
        match = Math.max(cachedFuzzyMatch(str1.substr(1), str2.substr(1),cache),
            cachedFuzzyMatch(str1, str2.substr(1), cache),
            cachedFuzzyMatch(str1.substr(1), str2, cache));
    }
    cache[key] = match;
    cache.length = cache.length + 1;
    return match;
}

/*
 * Notify the user of the bookmark that got updated.
 *
 * The notification will automatically disappear after 3 second so it is a real
 * notification that demands no action from the user interaction of the user is
 * required.
 *
 * @param {String} bookmarkTitle the title of the bookmark that got updated
 * @param {String} oldBookmarkUrl the old bookmark url
 * @param {String} newBookmarkUrl the new bookmark url
 *
 * see also:
 * http://developer.chrome.com/extensions/notifications.html
 */
function showUpdateNotification(bookmarkTitle, oldBookmarkUrl, newBookmarkUrl){
  //for now just mention the bookmark title, leave old and new url out.
  var body = "Update " +
    "\"" + bookmarkTitle + "\"";

  var notification = webkitNotifications.createNotification(
    '',  //don't use an icon
    'ComicUpdater',  // notification title
    body  // notification body text
  );
  notification.show();

  //automatically close the notification after 3 seconds
  //todo: allow timeout to be set in a settings page
  window.setTimeout(function (){notification.cancel();},3000);
}


/*
 * Todo: write function doc
 *
 * @param {String} str
 */
function extractDomainName(str){
  //strip of the protocol
  var i = str.indexOf('://');
  if( i==-1){
    console.error('the url "%s" contains no protocol specification', str)
  }
  str = str.slice(i+3);

  //strip www if present
  //a lot of sites have www.somesite.com and somesite.com configured as aliases
  //hence we shoudl treat them as identical
  if(str.slice(0,3) == "www.") {
    str = str.slice(3);
  }

  //strip everything after the domain name
  i = str.indexOf('/');
  if ( i >= 0) {
    str = str.slice(0,i);
  }


  return str;
}

/*
 * Todo: write function doc
 *
 * @param {String} str1
 * @param {String} str2
 *
 */
function hasMatchingDomainName(str1,str2){
  var domainName1 = extractDomainName(str1);
  var domainName2 = extractDomainName(str2);

  if( domainName1 == domainName2){
    return true;

  } else {
    return false;
  }

}

/*
 * Notify the user of the bookmark that got updated.
 *
 * The notification will automatically disappear after 5 second. If the user
 * clicks on the notification then the update action will be rolled back.
 * 
 *
 * @param {BookmarkTreeNode} bookmarkTreeNode the updated BookmarkTreeNode
 * @param {String} oldBookmarkUrl the old bookmark url that got updated
 *
 * see also:
 * http://developer.chrome.com/extensions/notifications.html
 */
function showUndoNotification(bookmarkTreeNode, oldBookmarkUrl){
  //for now just mention the bookmark title, leave old and new url out.
  var body = "Update  " +
    "\"" + bookmarkTreeNode.title + "\"";

  var notification = createTimedOutNotification(
    'Click to Undo!',  // notification title
    body,  // notification body text
    5000
  );

  //rollback the update if the notification is clicked
  notification.onclick = function(){
    //immediately close the current notification
    this.cancel();

    //undo the bookmark update
    chrome.bookmarks.update(
        String(bookmarkTreeNode.id),
        { url : oldBookmarkUrl });

    //log  rollback action
    console.group("Rollback update action");
    console.log("Reset the \"%s\" bookmark", bookmarkTreeNode.title);
    console.log('%O', bookmarkTreeNode);
    console.log("back to");
    console.log("  %s",  oldBookmarkUrl);
    console.groupEnd();

    //inform user of the undo action
    var body = 'Rolled back update of "' + bookmarkTreeNode.title + '"';
    var notification = createTimedOutNotification(
      'Update rolled back',
      body,
      5000
    );
    notification.show();
  };

  notification.show();

}

/*
 * Create a Nofitifaction object that will automatically disappear after a
 * given time without the need for any user interaction.
 *
 * @param {String} title the title of the notification.
 *
 * @param {String} body the body of the notification.
 *
 * @param {int} timeout the time in ms after which the notification should
 * automatically disappear once it is displayed.
 *
 * @returns {Notification} The returned notification can be displayed using the
 * show() method. It makes use of the ondisplay attribute to automatically
 * close it again after the given time has lapsed. 
 *
 * See also:
 * http://www.chromium.org/developers/design-documents/desktop-notifications/api-specification
 * http://developer.chrome.com/extensions/notifications.html
 *
 */
function createTimedOutNotification(title, body, timeout){
  var notification = webkitNotifications.createNotification(
    '', //don't use and icon
    title,
    body);

  //automatically close the notification 'timeout' milliseconds after it is
  //dislayed
  //todo: allow timeout to be set in a settings page
  notification.ondisplay = function(){
    window.setTimeout(
      function(){ notification.cancel()},
      timeout)
    }
  
  return notification;
}

