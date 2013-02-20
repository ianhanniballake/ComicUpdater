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
        var numMatchingChars = matchPrefix(node.url, tab.url);
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
      var confirmed = confirm("Updated bookmark \n" + 
            "   " + closestBookmarkList[0].url + "\n" + 
            "to\n" +
            "   " + tab.url + "\n");
      if(confirmed == true){
        chrome.bookmarks.update(
            String(closestBookmarkList[0].id),
            { url : tab.url });
      alert("Updated bookmark \n" + 
            "   " + closestBookmarkList[0].url + "\n" + 
            "to\n" +
            "   " + tab.url + "\n");
      }else{
        alert("No bookmark has been updated");
      }
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
 * @return {int} Returns the number of initial characters of both strings are
 * equal.
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
 * till the end of the shortest string.
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



