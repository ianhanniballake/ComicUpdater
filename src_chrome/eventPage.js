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
  var folderList = new Array();
  var maxMatchingChars = -1;
  var closestBookmarkList = new Array();
  for ( var i = 0; i < bookmarkTreeNode.length; i++) {
    folderList.push(bookmarkTreeNode[i]);
  }
  while (folderList.length > 0)
  {
    var rootNode = folderList.pop();
    for ( var i = 0; rootNode.children
        && i < rootNode.children.length; i++)
    {
      var node = rootNode.children[i];
      if (node.url)
      { // node is a bookmark
        var numMatchingChars = fuzzyMatch(node.url, tab.url);

        if (numMatchingChars > maxMatchingChars)
        {
          closestBookmarkList = new Array();
          maxMatchingChars = numMatchingChars;
        }
        if (numMatchingChars >= maxMatchingChars)
        {
          closestBookmarkList.push(node);
        }
      }
      else{
        // Node is a bookmark folder
        folderList.push(node);
      }
    }
  }
  if (maxMatchingChars < 10)
    alert("Could not find any bookmark that shares at least 10 characters!");
  else if (closestBookmarkList.length == 1){
      var title = closestBookmarkList[0].title;
      var oldUrl = closestBookmarkList[0].url;
      var newUrl = tab.url;
      chrome.bookmarks.update(
          String(closestBookmarkList[0].id),
          { url : newUrl });
      showUpdateNotification(title,oldUrl,newUrl);
  } else {
      var nodeList = "";
      for ( var h = 0; h < closestBookmarkList.length; h++)
        nodeList = nodeList + "  "
            + closestBookmarkList[h].url
            + "\n";
      alert("Could not find a unique closest bookmark. Found "
          + closestBookmarkList.length
          + " closest bookmarks:\n"
          + nodeList);
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


function extractDomainName(str){
  //strip of the protocol
  var i = str.indexof('://');
  str = str.slice(i+3);
  //strip www if present
  //a lot of sites have www.somesite.com and somesite.com configured as aliases
  //hence we shoudl treat them as identical
  if(str.slice(0,3) == "www") {
    str = str.slice(3);
  }

  return str
}
