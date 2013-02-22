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
      {
        var numMatchingChars = 0;
        for ( var j = 1; j < node.url.length
            && j < tab.url.length; j++)
        {
          if (node.url.substr(0, j) == tab.url
              .substr(0, j))
            numMatchingChars = j;
          else
            break;
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
      }
      else
        folderList.push(node);
    }
  }
  if (maxMatchingChars < 10)
    alert("Could not find any bookmark that shares at least 10 characters!");
  else if (closestBookmarkList.length == 1){
      chrome.bookmarks.update(
          String(closestBookmarkList[0].id),
          { url : tab.url });
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

