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
								chrome.bookmarks.update(
										String(closestBookmarkList[0].id),
										{ url : tab.url });
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