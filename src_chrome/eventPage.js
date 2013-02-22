// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked
		.addListener(function(tab)
		{
			var bookmarkTreeNodes = chrome.bookmarks
					.getTree(function searchBookmarks(bookmarkTreeNodes)
					{
						var folderList = new Array();
						var maxMatchingChars = -1;
						var closestBookmarkList = new Array();
						for ( var i = 0; i < bookmarkTreeNodes.length; i++)
							folderList.push(bookmarkTreeNodes[i]);
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
						else
							if (closestBookmarkList.length == 1)
							{
                var title = closestBookmarkList[0].title;
                var oldUrl = closestBookmarkList[0].url;
                var newUrl = tab.url;
                chrome.bookmarks.update(
                    String(closestBookmarkList[0].id),
                    { url : newUrl });
                showUpdateNotification(title,oldUrl,newUrl);
							}
							else
							{
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
					});
		});

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

